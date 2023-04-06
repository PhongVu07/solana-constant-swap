use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::*;

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        seeds = [
            b"swap_pool".as_ref(),
            authority.key().as_ref(),
            // token_a_mint.key().as_ref(),
            token_b_mint.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = SwapPool::SIZE + 8,
    )]
    pub swap_pool: Account<'info, SwapPool>,

    /// CHECK: no check
    #[account(mut)]
    pub authority: Signer<'info>,

    // #[account(mut)]
    // pub token_a_mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_b_mint: Account<'info, Mint>,

    // #[account(mut)]
    // pub token_a_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token_b_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub swap_pool: AccountInfo<'info>,

    #[account(mut)]
    pub user_token_b_account: Account<'info, TokenAccount>,

    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}