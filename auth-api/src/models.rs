use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
}

#[derive(Debug, Serialize,Deserialize)]
pub struct Claims {
    pub sub: String, // user id
    pub exp: usize,  // expiration (Unix timestamp)
}

#[derive(serde::Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    // Aquí podrías añadir: pub name: Option<String>, etc.
}
