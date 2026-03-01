use axum::{
    extract::{State, Json,Path,},
    response::IntoResponse,
    http::StatusCode,
};
use tracing::{info, error};
use serde_json::json;
use crate::state::AppState;
use crate::dto::register_request::RegisterRequest;
use crate::dto::recovery_request::RecoveryRequest;
use crate::dto::verify_recovery_code_request::VerifyRecoveryCodeRequest;
use crate::dto::login_request::LoginRequest;
use crate::dto::update_user_request::{UpdateUserRequest, ResetPasswordRequest};
use crate::errors::app_error::AppError;
use crate::services::auth_service::Claims;
use sqlx::Row;

#[utoipa::path(
    post,
    path = "/auth/recover",
    request_body = RecoveryRequest,
    responses(
        (status = 200, description = "Recovery email sent"),
        (status = 400, description = "Bad request"),
    ),
    tag = "auth"
)]
pub async fn recover_password(
    State(state): State<AppState>,
    Json(payload): Json<RecoveryRequest>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    info!("POST /auth/recover - email: {}", payload.email);
    if payload.email.trim().is_empty() {
        error!("/auth/recover - email vacío");
        return Err(AppError::BadRequest);
    }
    match state.recovery_service.recover_password(payload.email.as_str()).await {
        Ok(true) => Ok((
            StatusCode::OK,
            Json(json!({
                "message": "Se envió el código de recuperación al correo."
            }))
        )),
        Ok(false) => Ok((
            StatusCode::NOT_FOUND,
            Json(json!({
                "message": "Correo no registrado."
            }))
        )),
        Err(e) => {
            error!("/auth/recover - error: {:?}", e);
            Err(e)
        }
    }
}

#[utoipa::path(
    post,
    path = "/auth/register",
    request_body = RegisterRequest,
    responses(
        (status = 201, description = "User registered successfully"),
        (status = 400, description = "Bad request"),
    ),
    tag = "auth"
)]
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    info!("POST /auth/register - email: {}", payload.email);
    if payload.email.trim().is_empty() || payload.password.len() < 6 {
        error!("/auth/register - email vacío o password muy corto");
        return Err(AppError::BadRequest);
    }
    if let Err(e) = state.auth_service.register(payload).await {
        error!("/auth/register - error: {:?}", e);
        return Err(e);
    }
    Ok((
        StatusCode::CREATED,
        Json(json!({
            "message": "User registered successfully"
        }))
    ))
}

#[utoipa::path(
    post,
    path = "/auth/verify-recovery-code",
    request_body = VerifyRecoveryCodeRequest,
    responses(
        (status = 200, description = "Recovery code verified successfully"),
        (status = 400, description = "Bad request"),
    ),
    tag = "auth"
)]
pub async fn verify_recovery_code(
    State(state): State<AppState>,
    Json(payload): Json<VerifyRecoveryCodeRequest>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    info!("POST /auth/verify-recovery-code - email: {}", payload.email);
    if payload.email.trim().is_empty() || payload.code.trim().is_empty() {
        error!("/auth/verify-recovery-code - email o código vacío");
        return Err(AppError::BadRequest);
    }
    if let Err(e) = state.recovery_service
        .verify_code_only(payload.email.as_str(), payload.code.as_str()) // <--- Usar _only
        .await {
        error!("/auth/verify-recovery-code - error: {:?}", e);
        return Err(e);
    }
    Ok((
        StatusCode::OK,
        Json(json!({
            "message": "Recovery code verified successfully"
        }))
    ))
}

#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = String),
        (status = 401, description = "Invalid credentials"),
    ),
    tag = "auth"
)]
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    info!("POST /auth/login - email: {}", payload.email);

    // Validación básica
    if payload.email.trim().is_empty() || payload.password.is_empty() {
        return AppError::BadRequest.into_response();
    }

    match state.auth_service.login(payload).await {
        Ok((user, token)) => {
            info!("Login exitoso para usuario: {}", user.email);
            (StatusCode::OK, Json(json!({
                "token": token,
                "user": {
                    "id": user.user_id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email
                }
            }))).into_response()
        },
        Err(e) => {
            error!("Error en login: {:?}", e);
            e.into_response()
        }
    }
}

#[utoipa::path(
    post,
    path = "/auth/logout",
    responses(
        (status = 200, description = "Sesión cerrada correctamente"),
        (status = 401, description = "No autorizado"),
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "auth"
)]
pub async fn logout(
    State(state): State<AppState>,
    claims: Claims, // El extractor ahora funciona correctamente
) -> impl IntoResponse {
    match state.auth_service.logout(claims.sub).await {
        Ok(_) => (
            StatusCode::OK, 
            Json(serde_json::json!({ "message": "Sesión cerrada correctamente" }))
        ).into_response(),
        Err(e) => e.into_response(),
    }
}

#[utoipa::path(
    get,
    path = "/auth/me",
    responses(
        (status = 200, description = "Datos del usuario actual"),
        (status = 401, description = "No autorizado"),
    ),
    security(("bearer_auth" = [])),
    tag = "auth"
)]
pub async fn get_current_user(
    State(state): State<AppState>,
    claims: Claims,
) -> impl IntoResponse {
    // 1. Realizamos un INNER JOIN para obtener el nombre del rol
    let user = sqlx::query(
        r#"
        SELECT 
            u.user_id, u.email, u.first_name, u.last_name, u.role_id, u.profile_info,
            r.name as role_name
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.user_id = $1
        "#
    )
    .bind(claims.sub)
    .fetch_optional(&*state.auth_service.pool)
    .await;

    match user {
        Ok(Some(row)) => {
            use sqlx::Row;
            (StatusCode::OK, Json(json!({
                "id": row.get::<i32, _>("user_id"),
                "email": row.get::<String, _>("email"),
                "first_name": row.get::<String, _>("first_name"),
                "last_name": row.get::<String, _>("last_name"),
                "role_id": row.get::<i32, _>("role_id"),
                "role_name": row.get::<String, _>("role_name"), // <-- Nuevo campo
                "profile_info": row.get::<Option<String>, _>("profile_info")
            }))).into_response()
        },
        Ok(None) => AppError::Unauthorized.into_response(),
        Err(e) => {
            error!("Error en get_current_user: {:?}", e);
            AppError::DatabaseError.into_response()
        },
    }
}

#[utoipa::path(
    put,
    path = "/auth/users/{id}",
    request_body = UpdateUserRequest,
    responses((status = 200, description = "Usuario actualizado")),
    security(("bearer_auth" = [])),
    tag = "auth"
)]
pub async fn update_user(
    State(state): State<AppState>,
    Path(target_id): Path<i32>,
    claims: Claims,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<impl IntoResponse, AppError> {
    if payload.role_id.is_some() && claims.role != 3 {
        return Err(AppError::Unauthorized);
    }

    // Usamos query normal para evitar el error de conexión en Docker
    sqlx::query(
        r#"
        UPDATE users 
        SET first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            profile_info = COALESCE($3, profile_info),
            email = COALESCE($4, email),
            role_id = CASE WHEN $5 = 3 THEN COALESCE($6, role_id) ELSE role_id END
        WHERE user_id = $7
        "#
    )
    .bind(payload.first_name)
    .bind(payload.last_name)
    .bind(payload.profile_info)
    .bind(payload.email)
    .bind(claims.role)
    .bind(payload.role_id)
    .bind(target_id)
    .execute(&*state.auth_service.pool)
    .await
    .map_err(|_| AppError::DatabaseError)?;

    Ok(StatusCode::OK)
}

#[utoipa::path(
    post,
    path = "/auth/reset-password",
    request_body = ResetPasswordRequest,
    responses((status = 200, description = "Password reset exitoso")),
    tag = "auth"
)]
pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> Result<impl IntoResponse, AppError> {
    state.recovery_service.consume_code(&payload.email, &payload.code).await?;

    use argon2::{password_hash::{PasswordHasher, SaltString}, Argon2};
    // CORRECCIÓN DEL IMPORT DE OsRng
    use argon2::password_hash::rand_core::OsRng; 

    let salt = SaltString::generate(&mut OsRng);
    let hashed_password = Argon2::default()
        .hash_password(payload.new_password.as_bytes(), &salt)
        .map_err(|_| AppError::DatabaseError)?
        .to_string();

    let mut tx = state.auth_service.pool.begin().await.map_err(|_| AppError::DatabaseError)?;

    sqlx::query("UPDATE users SET password = $1 WHERE email = $2")
        .bind(hashed_password)
        .bind(&payload.email)
        .execute(&mut *tx).await.map_err(|_| AppError::DatabaseError)?;

    sqlx::query("DELETE FROM sessions WHERE user_id = (SELECT user_id FROM users WHERE email = $1)")
        .bind(&payload.email)
        .execute(&mut *tx).await.map_err(|_| AppError::DatabaseError)?;

    tx.commit().await.map_err(|_| AppError::DatabaseError)?;

    Ok((StatusCode::OK, Json(json!({"message": "Password actualizada"}))))
}
