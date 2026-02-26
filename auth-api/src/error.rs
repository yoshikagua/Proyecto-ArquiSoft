use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("BCrypt error: {0}")]
    Bcrypt(#[from] bcrypt::BcryptError),
    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("Email already exists")]
    EmailAlreadyExists,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "Invalid credentials"),
            ApiError::EmailAlreadyExists => (StatusCode::CONFLICT, "Email already exists"),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
        };
        let body = Json(json!({ "error": error_message }));
        (status, body).into_response()
    }
}
