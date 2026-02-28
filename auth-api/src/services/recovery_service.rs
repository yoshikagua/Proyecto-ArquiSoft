use argon2::PasswordVerifier;
use argon2::PasswordHash;
use sqlx::Row;
use rand::{distributions::Alphanumeric, Rng};
use sqlx::PgPool;
use chrono::{Utc, Duration};
use argon2::{
    Argon2,
    password_hash::{SaltString, PasswordHasher}
};
use password_hash::rand_core::OsRng;

use crate::{
    services::email_service::EmailService,
    // dto::email_request::EmailRequest,
    errors::app_error::AppError,
};

use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct RecoveryService {
    pub pool: Arc<PgPool>,
    pub email_service: EmailService,
}

impl RecoveryService {
    pub async fn recover_password(
        &self,
        email: &str,
    ) -> Result<bool, AppError> {
        // Buscar usuario por email
        let user = sqlx::query("SELECT user_id FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&*self.pool)
            .await
            .map_err(|_| AppError::DatabaseError)?;

        if let Some(user) = user {
            let user_id: i32 = user.get("user_id");
            // Generar código aleatorio alfanumérico
            let code: String = rand::thread_rng()
                .sample_iter(&Alphanumeric)
                .take(8)
                .map(char::from)
                .collect();

            // Hashear el código
            let salt = SaltString::generate(&mut OsRng);
            let argon2 = Argon2::default();
            let code_hash = argon2.hash_password(code.as_bytes(), &salt)
                .map_err(|_| AppError::DatabaseError)?
                .to_string();

            // Calcular expiración (por ejemplo, 15 minutos)
            let expires_at = Utc::now() + Duration::minutes(15);

            // Guardar el código en la base de datos
            sqlx::query("INSERT INTO recovery_codes (user_id, code_hash, expires_at) VALUES ($1, $2, $3)")
                .bind(user_id)
                .bind(&code_hash)
                .bind(expires_at)
                .execute(&*self.pool)
                .await
                .map_err(|_| AppError::DatabaseError)?;

            // Enviar email
            let body = format!("Tu código de recuperación es: {}", code);
            self.email_service.send_email(crate::dto::email_request::EmailRequest {
                to: email.to_string(),
                subject: "Código de recuperación".to_string(),
                body,
            }).await.map_err(|_| AppError::EmailError)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

impl RecoveryService {

    pub async fn verify_code(
        &self,
        email: &str,
        code: &str,
    ) -> Result<(), AppError> {
        // Buscar usuario
        let user = sqlx::query("SELECT user_id FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&*self.pool)
            .await
            .map_err(|_| AppError::DatabaseError)?;

        let user = match user {
            Some(u) => u,
            None => return Err(AppError::InvalidCredentials),
        };
        let user_id: i32 = user.get("user_id");

        // Eliminar códigos expirados
        sqlx::query("DELETE FROM recovery_codes WHERE user_id = $1 AND expires_at <= NOW()")
            .bind(user_id)
            .execute(&*self.pool)
            .await
            .map_err(|_| AppError::DatabaseError)?;

        // Buscar el código más reciente y no expirado
        let rec = sqlx::query("SELECT id, code_hash, expires_at FROM recovery_codes WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1")
            .bind(user_id)
            .fetch_optional(&*self.pool)
            .await
            .map_err(|_| AppError::DatabaseError)?;

        let rec = match rec {
            Some(r) => r,
            None => return Err(AppError::InvalidCredentials),
        };

        let code_hash: String = rec.get("code_hash");
        let code_id: i32 = rec.get("id");

        // Verificar el código
        let parsed_hash = PasswordHash::new(&code_hash).map_err(|_| AppError::InvalidCredentials)?;
        let argon2 = Argon2::default();
        argon2.verify_password(code.as_bytes(), &parsed_hash)
            .map_err(|_| AppError::InvalidCredentials)?;

        // Eliminar el código usado
        sqlx::query("DELETE FROM recovery_codes WHERE id = $1")
            .bind(code_id)
            .execute(&*self.pool)
            .await
            .map_err(|_| AppError::DatabaseError)?;

        Ok(())
    }
}