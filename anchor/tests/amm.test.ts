import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../target/types/amm";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getAccount,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { beforeEach } from "node:test";

// @ts-ignore
describe("AMM with Token-2022 and SPL Token Support", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Amm as Program<Amm>;
  
  // Test accounts
  let authority: anchor.web3.Keypair;
  let user: anchor.web3.Keypair;
  
  // SPL Token mints and accounts
  let splTokenA: anchor.web3.PublicKey;
  let splTokenB: anchor.web3.PublicKey;
  let userSplTokenA: anchor.web3.PublicKey;
  let userSplTokenB: anchor.web3.PublicKey;
  
  // Token-2022 mints and accounts
  let token2022A: anchor.web3.PublicKey;
  let token2022B: anchor.web3.PublicKey;
  let userToken2022A: anchor.web3.PublicKey;
  let userToken2022B: anchor.web3.PublicKey;
  
  // Pool accounts
  let splPool: anchor.web3.PublicKey;
  let token2022Pool: anchor.web3.PublicKey;
  

  beforeEach(async () => {
    // Create test keypairs
    authority = anchor.web3.Keypair.generate();
    user = anchor.web3.Keypair.generate();
    
    await provider.connection.requestAirdrop(authority.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user.publicKey, 10 * LAMPORTS_PER_SOL);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    splTokenA = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    
    splTokenB = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    
    // Create Token-2022 mints
    token2022A = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    token2022B = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    // Create user token accounts for SPL tokens
    userSplTokenA = await createAssociatedTokenAccount(
      provider.connection,
      user,
      splTokenA,
      user.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );
    
    userSplTokenB = await createAssociatedTokenAccount(
      provider.connection,
      user,
      splTokenB,
      user.publicKey,
      undefined,
      TOKEN_PROGRAM_ID
    );
    
    // Create user token accounts for Token-2022
    userToken2022A = await createAssociatedTokenAccount(
      provider.connection,
      user,
      token2022A,
      user.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    userToken2022B = await createAssociatedTokenAccount(
      provider.connection,
      user,
      token2022B,
      user.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    // Mint tokens to user accounts
    await mintTo(
      provider.connection,
      authority,
      splTokenA,
      userSplTokenA,
      authority,
      1000000000, // 1000 tokens with 6 decimals
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    
    await mintTo(
      provider.connection,
      authority,
      splTokenB,
      userSplTokenB,
      authority,
      1000000000,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    
    await mintTo(
      provider.connection,
      authority,
      token2022A,
      userToken2022A,
      authority,
      1000000000,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    
    await mintTo(
      provider.connection,
      authority,
      token2022B,
      userToken2022B,
      authority,
      1000000000,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
  });
  
  // @ts-ignore
  describe("SPL Token Pool", () => {
    let tokenAVault: anchor.web3.PublicKey;
    let tokenBVault: anchor.web3.PublicKey;
    let lpMint: anchor.web3.PublicKey;
    let userLpToken: anchor.web3.PublicKey;
    
    // @ts-ignore
    it("Initialize SPL token pool", async () => {
      // Find pool PDA
      [splPool] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), splTokenA.toBuffer(), splTokenB.toBuffer()],
        program.programId
      );
      
      // Find vault PDAs
      tokenAVault = anchor.utils.token.associatedAddress({
        mint: splTokenA,
        owner: splPool,
      });
      
      tokenBVault = anchor.utils.token.associatedAddress({
        mint: splTokenB,
        owner: splPool,
      });
      
      // Find LP mint PDA
      [lpMint] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("lp_mint"), splPool.toBuffer()],
        program.programId
      );
      
      const tx = await program.methods
        .initializePool(30) // 0.3% fee
        .accounts({
          authority: authority.publicKey,
          pool: splPool,
          tokenAMint: splTokenA,
          tokenBMint: splTokenB,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          lpMint: lpMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      console.log("SPL Pool initialized:", tx);
      
      // Verify pool was created
      const poolAccount = await program.account.pool.fetch(splPool);
      expect(poolAccount.feeRate).to.equal(30);
      expect(poolAccount.tokenAMint.toString()).to.equal(splTokenA.toString());
      expect(poolAccount.tokenBMint.toString()).to.equal(splTokenB.toString());
    });
    
    // @ts-ignore
    it("Add liquidity to SPL token pool", async () => {
      // Create user LP token account
      userLpToken = await createAssociatedTokenAccount(
        provider.connection,
        user,
        lpMint,
        user.publicKey,
        undefined,
        TOKEN_PROGRAM_ID
      );
      
      const amountA = 100000000; // 100 tokens
      const amountB = 200000000; // 200 tokens
      
      const tx = await program.methods
        .addLiquidity(new anchor.BN(amountA), new anchor.BN(amountB), new anchor.BN(0))
        .accounts({
          user: user.publicKey,
          pool: splPool,
          tokenAMint: splTokenA,
          tokenBMint: splTokenB,
          lpMint: lpMint,
          userTokenA: userSplTokenA,
          userTokenB: userSplTokenB,
          userLpToken: userLpToken,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      
      console.log("Added liquidity to SPL pool:", tx);
      
      // Verify liquidity was added
      const vaultAAccount = await getAccount(provider.connection, tokenAVault, undefined, TOKEN_PROGRAM_ID);
      const vaultBAccount = await getAccount(provider.connection, tokenBVault, undefined, TOKEN_PROGRAM_ID);
      
      expect(Number(vaultAAccount.amount)).to.equal(amountA);
      expect(Number(vaultBAccount.amount)).to.equal(amountB);
    });
    
    // @ts-ignore
    it("Swap tokens in SPL pool", async () => {
      const amountIn = 10000000; // 10 tokens
      const minAmountOut = 0;
      
      const tx = await program.methods
        .swap(new anchor.BN(amountIn), new anchor.BN(minAmountOut), true) // A to B
        .accounts({
          user: user.publicKey,
          pool: splPool,
          userTokenA: userSplTokenA,
          userTokenB: userSplTokenB,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tokenAMint: splTokenA,
          tokenBMint: splTokenB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      
      console.log("Swapped tokens in SPL pool:", tx);
    });
  });
  
  // @ts-ignore
  describe("Token-2022 Pool", () => {
    let tokenAVault: anchor.web3.PublicKey;
    let tokenBVault: anchor.web3.PublicKey;
    let lpMint: anchor.web3.PublicKey;
    let userLpToken: anchor.web3.PublicKey;
    
    // @ts-ignore
    it("Initialize Token-2022 pool", async () => {
      // Find pool PDA
      [token2022Pool] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), token2022A.toBuffer(), token2022B.toBuffer()],
        program.programId
      );
      
      // Find vault PDAs
      tokenAVault = anchor.utils.token.associatedAddress({
        mint: token2022A,
        owner: token2022Pool,
      });
      
      tokenBVault = anchor.utils.token.associatedAddress({
        mint: token2022B,
        owner: token2022Pool,
      });
      
      // Find LP mint PDA
      [lpMint] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("lp_mint"), token2022Pool.toBuffer()],
        program.programId
      );
      
      const tx = await program.methods
        .initializePool(25) // 0.25% fee
        .accounts({
          authority: authority.publicKey,
          pool: token2022Pool,
          tokenAMint: token2022A,
          tokenBMint: token2022B,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          lpMint: lpMint,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      
      console.log("Token-2022 Pool initialized:", tx);
      
      // Verify pool was created
      const poolAccount = await program.account.pool.fetch(token2022Pool);
      expect(poolAccount.feeRate).to.equal(25);
      expect(poolAccount.tokenAMint.toString()).to.equal(token2022A.toString());
      expect(poolAccount.tokenBMint.toString()).to.equal(token2022B.toString());
    });
    
    // @ts-ignore
    it("Add liquidity to Token-2022 pool", async () => {
      // Create user LP token account
      userLpToken = await createAssociatedTokenAccount(
        provider.connection,
        user,
        lpMint,
        user.publicKey,
        undefined,
        TOKEN_PROGRAM_ID
      );
      
      const amountA = 50000000; // 50 tokens
      const amountB = 100000000; // 100 tokens
      
      const tx = await program.methods
        .addLiquidity(new anchor.BN(amountA), new anchor.BN(amountB), new anchor.BN(0))
        .accounts({
          user: user.publicKey,
          pool: token2022Pool,
          tokenAMint: token2022A,
          tokenBMint: token2022B,
          lpMint: lpMint,
          userTokenA: userToken2022A,
          userTokenB: userToken2022B,
          userLpToken: userLpToken,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      
      console.log("Added liquidity to Token-2022 pool:", tx);
      
      // Verify liquidity was added
      const vaultAAccount = await getAccount(provider.connection, tokenAVault, undefined, TOKEN_2022_PROGRAM_ID);
      const vaultBAccount = await getAccount(provider.connection, tokenBVault, undefined, TOKEN_2022_PROGRAM_ID);
      
      expect(Number(vaultAAccount.amount)).to.equal(amountA);
      expect(Number(vaultBAccount.amount)).to.equal(amountB);
    });
    
    // @ts-ignore
    it("Swap tokens in Token-2022 pool", async () => {
      const amountIn = 5000000; // 5 tokens
      const minAmountOut = 0;
      
      const tx = await program.methods
        .swap(new anchor.BN(amountIn), new anchor.BN(minAmountOut), false) // B to A
        .accounts({
          user: user.publicKey,
          pool: token2022Pool,
          userTokenA: userToken2022A,
          userTokenB: userToken2022B,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tokenAMint: token2022A,
          tokenBMint: token2022B,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      
      console.log("Swapped tokens in Token-2022 pool:", tx);
    });
    
    // @ts-ignore
    it("Remove liquidity from Token-2022 pool", async () => {
      // Get current LP token balance
      const lpTokenAccount = await getAccount(provider.connection, userLpToken, undefined, TOKEN_PROGRAM_ID);
      const lpTokensToRemove = Number(lpTokenAccount.amount) / 2; // Remove half
      
      const tx = await program.methods
        .removeLiquidity(new anchor.BN(lpTokensToRemove), new anchor.BN(0), new anchor.BN(0))
        .accounts({
          user: user.publicKey,
          pool: token2022Pool,
          lpMint: lpMint,
          userTokenA: userToken2022A,
          userTokenB: userToken2022B,
          userLpToken: userLpToken,
          tokenAVault: tokenAVault,
          tokenBVault: tokenBVault,
          tokenAMint: token2022A,
          tokenBMint: token2022B,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([user])
        .rpc();
      
      console.log("Removed liquidity from Token-2022 pool:", tx);
    });
  });
});
