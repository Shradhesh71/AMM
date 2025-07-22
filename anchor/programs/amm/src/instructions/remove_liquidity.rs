use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{
        burn, Burn, Mint, TokenAccount, TokenInterface,
    },
};

use crate::{errors::AmmError, instructions::transfer_tokens_from_vault};
use crate::states::Pool;

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,


    #[account(
        mut,
        seeds = [b"lp_mint", pool.key().as_ref()],
        bump = pool.lp_mint_bump,
    )]
    pub lp_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
    )]
    pub token_a_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
    )]
    pub token_b_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
    )]
    pub user_token_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
    )]
    pub user_token_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
    )]
    pub user_lp_token: InterfaceAccount<'info, TokenAccount>,

    pub token_a_mint: InterfaceAccount<'info, Mint>,
    pub token_b_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn remove_liquidity(
    ctx: Context<RemoveLiquidity>,
    lp_tokens: u64,
    min_amount_a: u64,
    min_amount_b: u64,
) -> Result<()> {
    let pool = &ctx.accounts.pool;

    require!(lp_tokens > 0, AmmError::InvalidAmount);

    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;
    let lp_supply = ctx.accounts.lp_mint.supply;

    require!(lp_supply > 0, AmmError::InsufficientLiquidity);
    require!(lp_tokens <= lp_supply, AmmError::InvalidAmount);

    // Calculate proportional amounts to withdraw
    let amount_a = lp_tokens
        .checked_mul(reserve_a)
        .unwrap()
        .checked_div(lp_supply)
        .unwrap();

    let amount_b = lp_tokens
        .checked_mul(reserve_b)
        .unwrap()
        .checked_div(lp_supply)
        .unwrap();

    require!(amount_a >= min_amount_a, AmmError::SlippageExceeded);
    require!(amount_b >= min_amount_b, AmmError::SlippageExceeded);
    require!(amount_a > 0 && amount_b > 0, AmmError::InvalidAmount);

    // Burn LP tokens from user
    let cpi_accounts = Burn {
        mint: ctx.accounts.lp_mint.to_account_info(),
        from: ctx.accounts.user_lp_token.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    burn(cpi_ctx, lp_tokens)?;

    // Transfer tokens from pool to user
    let seeds = &[
        b"pool",
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];

    transfer_tokens_from_vault(
        &ctx.accounts.token_a_vault,
        &ctx.accounts.user_token_a,
        &ctx.accounts.pool.to_account_info(),
        &ctx.accounts.token_program,
        &ctx.accounts.token_a_mint,
        signer,
        amount_a,
    )?;

    transfer_tokens_from_vault(
        &ctx.accounts.token_b_vault,
        &ctx.accounts.user_token_b,
        &ctx.accounts.pool.to_account_info(),
        &ctx.accounts.token_program,
        &ctx.accounts.token_b_mint,
        signer,
        amount_b,
    )?;

    Ok(())
}
