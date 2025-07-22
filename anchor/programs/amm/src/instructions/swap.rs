use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{ Mint, TokenAccount, TokenInterface, },
};

use crate::{errors::AmmError, instructions::{transfer_tokens, transfer_tokens_from_vault}};
use crate::states::Pool;

#[derive(Accounts)]
pub struct Swap<'info> {
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

    pub token_a_mint: InterfaceAccount<'info, Mint>,
    pub token_b_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn swap(
    ctx: Context<Swap>, 
    amount_in: u64, 
    min_amount_out: u64,
    a_to_b: bool,
) -> Result<()> {
    let pool = &ctx.accounts.pool;
    
    let (reserve_in, reserve_out) = if a_to_b {
            (ctx.accounts.token_a_vault.amount, ctx.accounts.token_b_vault.amount)
        } else {
            (ctx.accounts.token_b_vault.amount, ctx.accounts.token_a_vault.amount)
        };

    let amount_in_with_fee = amount_in.checked_mul(10000_u64.checked_sub(pool.fee_rate as u64).unwrap()).unwrap().checked_div(10000).unwrap();
    let amount_out = amount_in_with_fee.checked_mul(reserve_out).unwrap()
            .checked_div(reserve_in.checked_add(amount_in_with_fee).unwrap()).unwrap();

    require!(amount_out >= min_amount_out, AmmError::SlippageExceeded);

    let seeds = &[
            b"pool",
            pool.token_a_mint.as_ref(),
            pool.token_b_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];
    
    if a_to_b {

            transfer_tokens(
                &ctx.accounts.user_token_a,
                &ctx.accounts.token_a_vault,
                &ctx.accounts.user,
                &ctx.accounts.token_program,
                &ctx.accounts.token_a_mint,
                amount_in,
            )?;

            transfer_tokens_from_vault(
                &ctx.accounts.token_b_vault,
                &ctx.accounts.user_token_b,
                &pool.to_account_info(),
                &ctx.accounts.token_program,
                &ctx.accounts.token_b_mint,
                signer,
                amount_out,
            )?;
    } else {
            
            transfer_tokens(
                &ctx.accounts.user_token_b,
                &ctx.accounts.token_b_vault,
                &ctx.accounts.user,
                &ctx.accounts.token_program,
                &ctx.accounts.token_b_mint,
                amount_in,
            )?;
            
            transfer_tokens_from_vault(
                &ctx.accounts.token_a_vault,
                &ctx.accounts.user_token_a,
                &pool.to_account_info(),
                &ctx.accounts.token_program,
                &ctx.accounts.token_a_mint,
                signer,
                amount_out,
            )?;
    }
    Ok(())
}

