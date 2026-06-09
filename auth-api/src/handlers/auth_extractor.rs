use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use crate::{services::auth_service::Claims, errors::app_error::AppError};
use std::env;
use crate::state::AppState;

#[async_trait]
impl FromRequestParts<AppState> for Claims {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        // 1. Extraer el header (igual que antes)
        let auth_header = parts.headers
            .get("Authorization")
            .and_then(|value| value.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized);
        }
        let token = &auth_header[7..];

        // 2. Validar JWT matemáticamente
        let secret = env::var("JWT_SECRET").map_err(|_| AppError::DatabaseError)?;
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        ).map_err(|_| AppError::Unauthorized)?;

        // 3. VERIFICACIÓN EN BASE DE DATOS (Sesión Única / Logout Real)
        let session_exists = sqlx::query(
            "SELECT 1 FROM sessions WHERE user_id = $1 AND refresh_token_hash = $2 AND expires_at > NOW()"
        )
        .bind(token_data.claims.sub)
        .bind(token) // Aquí comparamos con el token guardado
        .fetch_optional(&*state.auth_service.pool)
        .await
        .map_err(|_| AppError::DatabaseError)?;

        if session_exists.is_none() {
            return Err(AppError::Unauthorized);
        }

        Ok(token_data.claims)
    }
}
