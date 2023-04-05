use anchor_lang::prelude::*;

#[error_code]
pub enum SwapError {
    #[msg("There is not enough amount in pool.")]
    NotEnoughPoolAmount,
}
