use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        mint_to, Mint, MintTo, TokenAccount, TokenInterface,     },
};

use crate::{errors::AmmError, instructions::transfer_tokens};
use crate::states::Pool;

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
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
        mut
    )]
    pub token_b_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut,)]
    pub user_token_a: InterfaceAccount<'info, TokenAccount>,

    #[account(mut,)]
    pub user_token_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut
    )]
    pub user_lp_token: InterfaceAccount<'info, TokenAccount>,

    pub token_a_mint: InterfaceAccount<'info, Mint>,
    pub token_b_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
    min_lp_tokens: u64,
) -> Result<()> {
    let pool = &ctx.accounts.pool;

    require!(amount_a > 0 && amount_b > 0, AmmError::InvalidAmount);

    let reserve_a = ctx.accounts.token_a_vault.amount;
    let reserve_b = ctx.accounts.token_b_vault.amount;

    let lp_tokens_to_mint = if reserve_a == 0 && reserve_b == 0 {
        (amount_a.checked_mul(amount_b).unwrap() as f64).sqrt() as u64
    } else {
        let lp_supply = ctx.accounts.lp_mint.supply;
        let lp_from_a = amount_a.checked_mul(lp_supply).unwrap().checked_div(reserve_a).unwrap();
        let lp_from_b = amount_b.checked_mul(lp_supply).unwrap().checked_div(reserve_b).unwrap();
        std::cmp::min(lp_from_a, lp_from_b)
    };

    require!(lp_tokens_to_mint >= min_lp_tokens, AmmError::SlippageExceeded);
    require!(lp_tokens_to_mint > 0, AmmError::InvalidAmount);

    // Transfer tokens from user to pool vaults
    transfer_tokens(
        &ctx.accounts.user_token_a,
        &ctx.accounts.token_a_vault,
        &ctx.accounts.user,
        &ctx.accounts.token_program,
        &ctx.accounts.token_a_mint,
        amount_a,

    )?;
    transfer_tokens(
        &ctx.accounts.user_token_b,
        &ctx.accounts.token_b_vault,
        &ctx.accounts.user,
        &ctx.accounts.token_program,
        &ctx.accounts.token_b_mint,
        amount_b,
    )?;
    
    // Mint LP tokens to user
    let seeds = &[
        b"pool",
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.lp_mint.to_account_info(),
        to: ctx.accounts.user_lp_token.to_account_info(),
        authority: ctx.accounts.lp_mint.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    mint_to(cpi_ctx, lp_tokens_to_mint)?;

    Ok(())
}

