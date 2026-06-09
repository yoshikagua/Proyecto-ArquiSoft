use crate::auth::{create_jwt, hash_password, verify_password, validate_jwt};
use crate::error::ApiError;
use crate::models::{AuthResponse, LoginRequest, RegisterRequest, User,UpdateUserRequest};
use axum::{
    extract::{State, Request}, // Importamos Request desde extract
    http::{StatusCode, header},
    middleware::Next,
    response::{IntoResponse, Response},
    Extension,
    Json,
};
// use axum_extra::extract::cookie::{Cookie, CookieJar}; // Removed to resolve axum version conflict
use serde_json::json;
use sqlx::PgPool;
use time::Duration;

pub async fn register(
    State(pool): State<PgPool>,
    Json(req): Json<RegisterRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let existing_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_optional(&pool)
        .await?;
        
    if existing_user.is_some() {
        return Err(ApiError::EmailAlreadyExists);
    }

    let password_hash = hash_password(&req.password)?;

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
    )
    .bind(&req.email)
    .bind(&password_hash)
    .fetch_one(&pool)
    .await?;

    let token = create_jwt(&user.id.to_string())?;

    Ok(Json(AuthResponse { token }))
}

pub async fn login(
    State(pool): State<PgPool>,
    Json(req): Json<LoginRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_optional(&pool)
        .await?
        .ok_or(ApiError::InvalidCredentials)?;

    if !verify_password(&req.password, &user.password_hash)? {
        return Err(ApiError::InvalidCredentials);
    }

    let token = create_jwt(&user.id.to_string())?;

    Ok(Json(AuthResponse { token }))
}

pub async fn logout(jar: CookieJar) -> impl IntoResponse {
    // 1. Corregimos el warning: usamos .build() en lugar de .finish()
    let cookie = Cookie::build(("jwt", ""))
        .path("/")
        .max_age(Duration::ZERO)
        .http_only(true)
        .build(); // Antes era .finish()

    // 2. Corregimos el error de la tupla:
    // El orden correcto es (ModificadorDeResponse, Cuerpo)
    // O simplemente (CookieJar, Json) ya que el StatusCode por defecto es 200 OK
    (jar.add(cookie), Json(json!({"message": "Logout successful"})))
}

// --- MIDDLEWARE CORREGIDO PARA AXUM 0.7 ---
pub async fn auth_middleware(
    mut request: Request, // Ya no lleva <B>
    next: Next,          // Ya no lleva <B>
) -> Result<Response, StatusCode> {
    let token = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = validate_jwt(token).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Insertar el sub (user_id) en las extensiones
    request.extensions_mut().insert(claims.sub);

    Ok(next.run(request).await)
}

pub async fn protected() -> Result<impl IntoResponse, StatusCode> {
    Ok(Json(json!({ "message": "Access granted to protected route" })))
}

pub async fn get_me(
    State(pool): State<PgPool>,
    Extension(user_id): Extension<String>, // Extraemos el ID del middleware
) -> Result<impl IntoResponse, ApiError> {
    // Buscamos al usuario en la DB por su ID
    // Convertimos el string a UUID si es necesario según tu modelo
    let user_uuid = uuid::Uuid::parse_str(&user_id)
        .map_err(|_| ApiError::InternalServerError)?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_uuid)
        .fetch_optional(&pool)
        .await?
        .ok_or(ApiError::InternalServerError)?; // O UserNotFound si lo tienes

    // Devolvemos el usuario (Axum/Serde se encargará de no enviar el password_hash 
    // si usas #[serde(skip_serializing)] en tu modelo)
    Ok(Json(user))
}

pub async fn update_me(
    State(pool): State<PgPool>,
    Extension(user_id): Extension<String>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let user_uuid = uuid::Uuid::parse_str(&user_id)
        .map_err(|_| ApiError::InternalServerError)?;

    // Si el usuario envió un nuevo email, verificamos que no esté en uso
    if let Some(ref new_email) = req.email {
        let exists = sqlx::query("SELECT id FROM users WHERE email = $1 AND id != $2")
            .bind(new_email)
            .bind(user_uuid)
            .fetch_optional(&pool)
            .await?;
        
        if exists.is_some() {
            return Err(ApiError::EmailAlreadyExists);
        }
    }

    // Actualizamos en la base de datos
    // Usamos COALESCE para mantener el valor actual si el campo es NULL en el JSON
    let user = sqlx::query_as::<_, User>(
        r#"
        UPDATE users 
        SET email = COALESCE($1, email)
        WHERE id = $2
        RETURNING *
        "#
    )
    .bind(&req.email)
    .bind(user_uuid)
    .fetch_one(&pool)
    .await?;

    Ok(Json(user))
}
