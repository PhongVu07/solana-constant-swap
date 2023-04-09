use {
    anchor_lang::error_code,
};

#[error_code]
pub enum SwapPoolError {
    #[msg("Rate must be greater than zero.")]
    SwapRateError,
}
