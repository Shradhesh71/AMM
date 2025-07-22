#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

pub mod errors;
pub mod instructions;
pub mod states;

use instructions::*;

#[program]
pub mod amm {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>, fee_rate: u16) -> Result<()> {
        instructions::initialize_pool(ctx, fee_rate)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
        min_lp_tokens: u64,
    ) -> Result<()> {
        instructions::add_liquidity(ctx, amount_a, amount_b, min_lp_tokens)
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_tokens: u64,
        min_amount_a: u64,
        min_amount_b: u64,
    ) -> Result<()> {
        instructions::remove_liquidity(ctx, lp_tokens, min_amount_a, min_amount_b)
    }

    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        a_to_b: bool,
    ) -> Result<()> {
        instructions::swap(ctx, amount_in, min_amount_out, a_to_b)
    }
}