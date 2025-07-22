use anchor_lang::prelude::*;

#[error_code]
pub enum AmmError {
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Insufficient liquidity in the pool")]
    InsufficientLiquidity,
    #[msg("Pool already initialized")]
    PoolAlreadyInitialized,
    #[msg("Invalid fee rate. Must be between 0 and 10000 basis points")]
    InvalidFeeRate,
    #[msg("Mathematical overflow occurred")]
    MathOverflow,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid pool state")]
    InvalidPoolState,
    #[msg("Token mints must be different")]
    IdenticalMints,
}
