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
    #[error("User not found")]
    UserNotFound,
    #[error("Internal server error")]
    InternalServerError,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::InvalidCredentials => (StatusCode::UNAUTHORIZED, self.to_string()),
            ApiError::EmailAlreadyExists => (StatusCode::CONFLICT, self.to_string()),
            ApiError::UserNotFound => (StatusCode::NOT_FOUND, self.to_string()),
            // Para errores de base de datos o internos, ocultamos el detalle técnico al usuario
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "An unexpected error occurred".to_string()),
        };
        
        let body = Json(json!({ "error": error_message }));
        (status, body).into_response()
    }
}
