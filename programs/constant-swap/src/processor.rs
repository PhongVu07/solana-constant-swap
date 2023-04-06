use anchor_lang::prelude::*;
use anchor_lang::solana_program::log::sol_log_compute_units;
use anchor_lang::system_program;

use crate::{instructions::*, SwapPool};

pub fn initialize_pool(
    ctx: Context<InitializePool>,
    token_b_price: u64
) -> Result<()> {
    let swap_pool = &mut ctx.accounts.swap_pool;

    swap_pool.authority = ctx.accounts.authority.key();
    // swap_pool.token_a_account = ctx.accounts.token_a_account.key();
    swap_pool.token_b_account = ctx.accounts.token_b_account.key();
    // swap_pool.token_a_mint = ctx.accounts.token_a_mint.key();
    swap_pool.token_b_mint = ctx.accounts.token_b_mint.key();
    swap_pool.token_b_price = token_b_price;

    msg!("Swap pool created");
    sol_log_compute_units();
    Ok(())
}

pub fn swap_a_for_b(ctx: Context<Swap>, sol_amount: u64) -> Result<()> {
    let swap_account = *ctx.accounts.swap_pool.to_account_info().try_borrow_data().unwrap();
    let swap_account_data = &mut SwapPool::try_deserialize( swap_account).unwrap();

    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.swap_pool.to_account_info(),
        });
    system_program::transfer(cpi_context, sol_amount)?;

    let token_b_amount = sol_amount.checked_mul(swap_account_data.price);
    // let cpi_context = CpiContext::new(
    //     ctx.accounts.system_program.to_account_info(),
    //     system_program::Transfer {
    //         from: ctx.accounts.user.to_account_info(),
    //         to: ctx.accounts.swap_pool.to_account_info(),
    //     });
    // system_program::transfer(cpi_context, token_b_amount)?;

    msg!("Swapped");
    sol_log_compute_units();
    Ok(())
}
