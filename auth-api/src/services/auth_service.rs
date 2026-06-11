use sqlx::PgPool;
use argon2::{
    Argon2,
    PasswordHasher, PasswordVerifier, PasswordHash
};
use password_hash::{SaltString, rand_core::OsRng};
<<<<<<< HEAD
=======
use rand::{distributions::Alphanumeric, Rng};
>>>>>>> origin/interoperabilidad
use chrono::Utc;

use jsonwebtoken::{encode, Header, EncodingKey};

use crate::{
    dto::{register_request::RegisterRequest, email_request::EmailRequest,login_request::LoginRequest},
    services::email_service::EmailService,
<<<<<<< HEAD
=======
    services::google_auth_service::{GoogleAuthService, GoogleClaims},
>>>>>>> origin/interoperabilidad
    errors::app_error::AppError,
    models::user::User,
};

use std::sync::Arc;
use std::env;

#[derive(Debug, Clone)]
pub struct AuthService {
    pub pool: Arc<PgPool>,
    pub email_service: EmailService,
<<<<<<< HEAD
=======
    pub google_auth_service: GoogleAuthService,
>>>>>>> origin/interoperabilidad
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

<<<<<<< HEAD

    // 3.AQUÍ MANEJAMOS LA SESIÓN ÚNICA
    
    let mut tx = self.pool.begin().await.map_err(|_| AppError::DatabaseError)?;

    // A. Borrar sesiones anteriores del mismo usuario (Garantiza sesión única)
    sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user.user_id)
=======
        // 3. Emitir sesión (JWT + sesión única en DB)
        let token = self.issue_session(&user).await?;

        Ok((user, token))
    }

    /// Login/registro vía Google: el ID token ya fue verificado por GoogleAuthService.
    /// Si el email no existe, crea el usuario (rol "user", password aleatoria irrecuperable).
    pub async fn google_login(&self, claims: GoogleClaims) -> Result<(User, String), AppError> {
        let email = claims.email.trim().to_lowercase();

        let existing = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
            .bind(&email)
            .fetch_optional(&*self.pool)
            .await
            .map_err(|_| AppError::DatabaseError)?;

        let user = match existing {
            Some(user) => user,
            None => {
                let first_name = claims.given_name.unwrap_or_else(|| "Usuario".to_string());
                let last_name = claims.family_name.unwrap_or_default();

                // Password aleatoria: la cuenta nace ligada a Google y nunca se usa para login con password
                let random_password: String = rand::thread_rng()
                    .sample_iter(&Alphanumeric)
                    .take(32)
                    .map(char::from)
                    .collect();
                let salt = SaltString::generate(&mut OsRng);
                let password_hash = Argon2::default()
                    .hash_password(random_password.as_bytes(), &salt)
                    .map_err(|_| AppError::DatabaseError)?
                    .to_string();

                sqlx::query_as::<_, User>(
                    r#"
                    INSERT INTO users (email, password, first_name, last_name, profile_info, role_id, is_active, created_at)
                    VALUES ($1, $2, $3, $4, '', 1, true, NOW())
                    RETURNING *
                    "#
                )
                .bind(&email)
                .bind(&password_hash)
                .bind(&first_name)
                .bind(&last_name)
                .fetch_one(&*self.pool)
                .await
                .map_err(|_| AppError::DatabaseError)?
            }
        };

        let token = self.issue_session(&user).await?;

        Ok((user, token))
    }

    /// Borra sesiones previas del usuario (sesión única) y emite un JWT nuevo,
    /// guardando su registro en `sessions`. Usado por login normal y login con Google.
    async fn issue_session(&self, user: &User) -> Result<String, AppError> {
        let mut tx = self.pool.begin().await.map_err(|_| AppError::DatabaseError)?;

        // A. Borrar sesiones anteriores del mismo usuario (Garantiza sesión única)
        sqlx::query("DELETE FROM sessions WHERE user_id = $1")
            .bind(user.user_id)
            .execute(&mut *tx)
            .await
            .map_err(|_| AppError::DatabaseError)?;

        // B. Generar datos del JWT
        let secret = env::var("JWT_SECRET").map_err(|_| AppError::DatabaseError)?;
        let now = Utc::now().timestamp();
        let expiration = now + (24 * 3600);

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

        // C. Guardar la nueva sesión en la DB
        sqlx::query(
            "INSERT INTO sessions (user_id, refresh_token_hash, expires_at, created_at)
             VALUES ($1, $2, $3, NOW())"
        )
        .bind(user.user_id)
        .bind(&token)
        .bind(Utc::now() + chrono::Duration::hours(24))
>>>>>>> origin/interoperabilidad
        .execute(&mut *tx)
        .await
        .map_err(|_| AppError::DatabaseError)?;

<<<<<<< HEAD
    // B. Generar datos del JWT
    let secret = env::var("JWT_SECRET").map_err(|_| AppError::DatabaseError)?;
    let now = Utc::now().timestamp();
    let expiration = now + (24 * 3600); 

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

    // C. Guardar la nueva sesión en la DB
    // Nota: Guardamos el hash del token o el token mismo según tu modelo
    sqlx::query(
        "INSERT INTO sessions (user_id, refresh_token_hash, expires_at, created_at) 
         VALUES ($1, $2, $3, NOW())"
    )
    .bind(user.user_id)
    .bind(&token) // O un hash de este si prefieres
    .bind(Utc::now() + chrono::Duration::hours(24))
    .execute(&mut *tx)
    .await
    .map_err(|_| AppError::DatabaseError)?;

    tx.commit().await.map_err(|_| AppError::DatabaseError)?;

    Ok((user, token))    }
    
=======
        tx.commit().await.map_err(|_| AppError::DatabaseError)?;

        Ok(token)
    }

>>>>>>> origin/interoperabilidad
    pub async fn logout(&self, user_id: i32) -> Result<(), AppError> {
        sqlx::query("DELETE FROM sessions WHERE user_id = $1")
            .bind(user_id)
            .execute(&*self.pool)
            .await
            .map_err(|_| AppError::DatabaseError)?;
        
        Ok(())
    }
}
