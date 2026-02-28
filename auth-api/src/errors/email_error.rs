use thiserror::Error;

#[derive(Debug, Error)]
pub enum EmailError {
    #[error("Email service error")]
    ServiceError,
    #[error("Email config error")]
    ConfigError,
    #[error("Email send error")]
    SendError,
}