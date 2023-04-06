use anchor_lang::prelude::*;

#[account]
pub struct SwapPool {
    pub authority: Pubkey,
    // pub token_a_account: Pubkey,
    pub token_b_account: Pubkey,
    // pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_b_price: u64
}

impl SwapPool {
    pub const SIZE: usize = 32 * 5 + 8;
}