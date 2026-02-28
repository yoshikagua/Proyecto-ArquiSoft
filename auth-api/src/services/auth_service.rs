use sqlx::PgPool;
use argon2::{
    Argon2,
    PasswordHasher, PasswordVerifier, PasswordHash
};
use password_hash::{SaltString, rand_core::OsRng};
use chrono::Utc;

use jsonwebtoken::{encode, Header, EncodingKey};

use crate::{
    dto::{register_request::RegisterRequest, email_request::EmailRequest,login_request::LoginRequest},
    services::email_service::EmailService,
    errors::app_error::AppError,
    models::user::User,
};

use std::sync::Arc;
use std::env;

#[derive(Debug, Clone)]
pub struct AuthService {
    pub pool: Arc<PgPool>,
    pub email_service: EmailService,
}

use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i32,    // User ID
    pub exp: i64,    // Expiration Time
    pub iat: i64,    // Issued At
    pub role: i32,   // rol ID
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
pub async fn login(&self, payload: LoginRequest) -> Result<(User, String), AppError> {
        let email = payload.email.trim().to_lowercase();

        // 1. Buscar el usuario
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE email = $1"
        )
        .bind(&email)
        .fetch_optional(&*self.pool)
        .await
        .map_err(|_| AppError::DatabaseError)?
        .ok_or(AppError::InvalidCredentials)?;

        // 2. Verificar la contraseña
        // SE CORRIGIÓ: Usar el tipo PasswordHash correctamente
        let hash = PasswordHash::new(&user.password)
            .map_err(|_| AppError::DatabaseError)?;

        // Requiere que 'PasswordVerifier' esté en el scope (añadido en los use)
        Argon2::default()
            .verify_password(payload.password.as_bytes(), &hash)
            .map_err(|_| AppError::InvalidCredentials)?;

        // 3. Generar JWT
        let secret = env::var("JWT_SECRET").map_err(|_| {
            tracing::error!("JWT_SECRET no configurada en .env");
            AppError::DatabaseError
        })?;
        
        let now = Utc::now().timestamp();
        let expiration = now + (24 * 3600); // 24 horas

        let claims = Claims {
            sub: user.user_id,
            exp: expiration,
            iat: now,
            role: user.role_id,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        ).map_err(|_| AppError::DatabaseError)?;

        Ok((user, token))
    }
}
