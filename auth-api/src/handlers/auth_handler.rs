use axum::{
    extract::{State, Json},
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
use crate::errors::app_error::AppError;
use crate::services::auth_service::Claims;

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
        .verify_code(payload.email.as_str(), payload.code.as_str())
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
