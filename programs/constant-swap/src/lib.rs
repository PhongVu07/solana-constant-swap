use anchor_lang::prelude::*;

pub mod state;
pub use state::*;
pub mod processor;
pub use processor::*;
pub mod instructions;
pub use instructions::*;
pub mod error;
pub use error::*;


declare_id!("9BdyJstDDVNPJS7PKzBQvCPKhtdEgBoQqVvFGH5rMkui");

#[program]
pub mod constant_swap {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>, sol_to_token_rate: u64) -> Result<()> {
        processor::initialize_pool(ctx, sol_to_token_rate)
    }

    pub fn swap_sol_for_token(ctx: Context<Swap>, sol_amount: u64, bump: u8) -> Result<()> {
        processor::swap_sol_for_token(ctx, sol_amount, bump)
    }
}

