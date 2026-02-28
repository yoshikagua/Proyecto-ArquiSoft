use sqlx::PgPool;
use argon2::{
    Argon2,
    password_hash::{SaltString, PasswordHasher}
};
use password_hash::rand_core::OsRng;

use crate::{
    dto::{register_request::RegisterRequest, email_request::EmailRequest},
    services::email_service::EmailService,
    errors::app_error::AppError,
};

use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct AuthService {
    pub pool: Arc<PgPool>,
    pub email_service: EmailService,
}

impl AuthService {

    pub async fn register(
        &self,
        payload: RegisterRequest,
    ) -> Result<(), AppError> {
        let email = payload.email.trim().to_lowercase();
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(payload.password.as_bytes(), &salt)
            .map_err(|_| AppError::DatabaseError)?
            .to_string();

        let role_id = payload.role_id.unwrap_or(1);

        let mut tx = self.pool.begin()
            .await
            .map_err(|_| AppError::DatabaseError)?;

        let result = sqlx::query(
            r#"
            INSERT INTO users (
                email,
                password,
                first_name,
                last_name,
                profile_info,
                role_id,
                is_active,
                created_at
            )
            VALUES ($1, $2, $3, $4, '', $5, true, NOW())
            "#
        )
        .bind(&email)
        .bind(&password_hash)
        .bind(&payload.first_name)
        .bind(&payload.last_name)
        .bind(&role_id)
        .execute(&mut *tx)
        .await;

        if let Err(e) = result {
            if let sqlx::Error::Database(db_err) = &e {
                if db_err.constraint() == Some("users_email_key") {
                    return Err(AppError::AlreadyExists);
                }
            }
            return Err(AppError::DatabaseError);
        }

        tx.commit()
            .await
            .map_err(|_| AppError::DatabaseError)?;

        if let Err(e) = self.email_service
            .send_email(EmailRequest {
                to: email.clone(),
                subject: "Welcome!".to_string(),
                body: format!("Welcome, {}!", payload.first_name),
            })
            .await {
            tracing::error!("Error enviando email a {}: {:?}", email, e);
            return Err(AppError::EmailError);
        }

        Ok(())
    }
}