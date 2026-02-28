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
}

use axum::{response::{IntoResponse, Response}, http::StatusCode};

impl IntoResponse for AppError {
	fn into_response(self) -> Response {
		   let status = match self {
			   AppError::BadRequest => StatusCode::BAD_REQUEST,
			   AppError::AlreadyExists => StatusCode::CONFLICT,
			   AppError::DatabaseError => StatusCode::INTERNAL_SERVER_ERROR,
			   AppError::EmailError => StatusCode::INTERNAL_SERVER_ERROR,
			   AppError::InvalidCredentials => StatusCode::UNAUTHORIZED,
		   };
		   (status, self.to_string()).into_response()
	}
}
