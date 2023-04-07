use anchor_lang::prelude::*;

#[account]
pub struct SwapPool {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub token_mint: Pubkey,
    pub sol_to_token_rate: u64
}

impl SwapPool {
    pub const SIZE: usize = 32 * 3 + 8;
}