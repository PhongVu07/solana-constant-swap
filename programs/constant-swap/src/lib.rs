use anchor_lang::prelude::*;

pub mod state;
pub use state::*;
pub mod processor;
pub use processor::*;
pub mod instructions;
pub use instructions::*;
pub mod errors;
pub use errors::*;

declare_id!("9TAK4Mjf9HXAAjtQqr4gkzA7nbbTikWMVK4zXoKZTTFC");

#[program]
pub mod constant_swap {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>, token_b_price: u64) -> Result<()> {
        processor::initialize_pool(ctx, token_b_price)
    }
}

