use anchor_lang::prelude::*;
use anchor_lang::solana_program::log::sol_log_compute_units;

use crate::instructions::*;

pub fn initialize_pool(
    ctx: Context<InitializePool>,
    token_b_price: u64
) -> Result<()> {
    let swap_pool = &mut ctx.accounts.swap_pool;

    swap_pool.authority = ctx.accounts.authority.key();
    swap_pool.token_a_account = ctx.accounts.token_a_account.key();
    swap_pool.token_b_account = ctx.accounts.token_b_account.key();
    swap_pool.token_a_mint = ctx.accounts.token_a_mint.key();
    swap_pool.token_b_mint = ctx.accounts.token_b_mint.key();
    swap_pool.token_b_price = token_b_price;

    msg!("Swap pool created");
    sol_log_compute_units();
    Ok(())
}
