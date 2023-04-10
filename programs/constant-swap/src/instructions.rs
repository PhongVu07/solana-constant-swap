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
            token_mint.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = SwapPool::SIZE + 8,
    )]
    pub swap_pool: Account<'info, SwapPool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut, has_one = token_account)]
    pub swap_pool: Account<'info, SwapPool>,

    #[account(
        mut,
        constraint = swap_pool.token_account == token_account.key(),
        constraint = token_account.owner == pool_signer.key()
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: This program's PDA, therefore no need to check
    #[account(
        seeds = [swap_pool.to_account_info().key().as_ref()],
        bump,
    )]
    pub pool_signer: AccountInfo<'info>,

    #[account(mut,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
