// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import AmmIDL from '../target/idl/amm.json'
import type { Amm } from '../target/types/amm'

// Re-export the generated IDL and type
export { Amm, AmmIDL }

// The programId is imported from the program IDL.
export const AMM_PROGRAM_ID = new PublicKey(AmmIDL.address)

// This is a helper function to get the Amm Anchor program.
export function getAmmProgram(provider: AnchorProvider, address?: PublicKey): Program<Amm> {
  return new Program({ ...AmmIDL, address: address ? address.toBase58() : AmmIDL.address } as Amm, provider)
}

// This is a helper function to get the program ID for the Amm program depending on the cluster.
export function getAmmProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Amm program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return AMM_PROGRAM_ID
  }
}
