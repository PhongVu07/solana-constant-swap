use anchor_lang::prelude::*;

#[account]
pub struct SwapPool {
    pub authority: Pubkey,
    /// Address of token A liquidity account
    pub token_a_account: Pubkey,
    /// Address of token B liquidity account
    pub token_b_account: Pubkey,
    /// Address of token A mint
    pub token_a_mint: Pubkey,
    /// Address of token B mint
    pub token_b_mint: Pubkey,

    pub token_b_price: u64
}

impl SwapPool {
    pub const SIZE: usize = 32 * 5 + 8;
}