use anchor_lang::prelude::*;
use anchor_lang::solana_program::log::sol_log_compute_units;
use anchor_lang::system_program;

use crate::instructions::*;
use crate::error::*;

const SOL_DECIMAL: u64 = 1_000_000_000;

pub fn initialize_pool(ctx: Context<InitializePool>, sol_to_token_rate: u64) -> Result<()> {
    require!(sol_to_token_rate.gt(&0), SwapPoolError::SwapRateError);

    let swap_pool = &mut ctx.accounts.swap_pool;

    swap_pool.authority = ctx.accounts.authority.key();
    swap_pool.token_account = ctx.accounts.token_account.key();
    swap_pool.token_mint = ctx.accounts.token_mint.key();
    swap_pool.sol_to_token_rate = sol_to_token_rate;

    msg!("Swap pool created");
    sol_log_compute_units();
    Ok(())
}

pub fn swap_sol_for_token(ctx: Context<Swap>, sol_amount: u64, bump: u8) -> Result<()> {
    require!(sol_amount.gt(&0), SwapPoolError::SwapAmountError);

    let swap_pool = &mut ctx.accounts.swap_pool;

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: swap_pool.to_account_info(),
            },
        ),
        sol_amount,
    )?;

    let token_amount = sol_amount
        .checked_mul(swap_pool.sol_to_token_rate)
        .unwrap()
        .checked_div(SOL_DECIMAL)
        .unwrap();

    let pool_key = swap_pool.to_account_info().key();
    let seeds = &[pool_key.as_ref(), &[bump]];
    let pool_signer = &[&seeds[..]];
    anchor_spl::token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.pool_signer.to_account_info(),
            },
            pool_signer,
        ),
        token_amount,
    )?;

    msg!("Swapped");
    sol_log_compute_units();
    Ok(())
}
