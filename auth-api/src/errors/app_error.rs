use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
	#[error("Bad request")] 
	BadRequest,
	#[error("El email ya está registrado")] 
	AlreadyExists,
	#[error("Database error")] 
	DatabaseError,
	#[error("Email error")] 
	EmailError,
	#[error("Invalid credentials")] 
	InvalidCredentials,
  #[error("No autorizado")] 
  Unauthorized,
}

use axum::{response::{IntoResponse, Response}, http::StatusCode};

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match self {
            AppError::BadRequest => StatusCode::BAD_REQUEST,
            AppError::AlreadyExists => StatusCode::CONFLICT,
            AppError::InvalidCredentials | AppError::Unauthorized => StatusCode::UNAUTHORIZED,
            AppError::DatabaseError | AppError::EmailError => StatusCode::INTERNAL_SERVER_ERROR,
        };
        (status, self.to_string()).into_response()
    }
}
