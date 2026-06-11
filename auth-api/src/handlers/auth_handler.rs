use axum::Extension;
use axum::{
    extract::{State, Json, Path},
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
use crate::dto::change_password_request::ChangePasswordRequest;
use crate::dto::google_auth_request::GoogleAuthRequest;
use crate::errors::app_error::AppError;
use crate::services::auth_service::Claims;
use sqlx::Row;
pub use crate::models::user_list_response::{PaginationParams, UserListResponse};

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
    Json(mut payload): Json<RegisterRequest>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    info!("POST /auth/register - email: {}", payload.email);

    payload.role_id = Some(1);

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
        .verify_code_only(payload.email.as_str(), payload.code.as_str())
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
    path = "/auth/google",
    request_body = GoogleAuthRequest,
    responses(
        (status = 200, description = "Login con Google exitoso", body = String),
        (status = 401, description = "Token de Google inválido"),
    ),
    tag = "auth"
)]
pub async fn google_login(
    State(state): State<AppState>,
    Json(payload): Json<GoogleAuthRequest>,
) -> impl IntoResponse {
    info!("POST /auth/google");

    let claims = match state.auth_service.google_auth_service.verify(&payload.credential).await {
        Ok(c) => c,
        Err(e) => {
            error!("Error verificando token de Google: {:?}", e);
            return e.into_response();
        }
    };

    match state.auth_service.google_login(claims).await {
        Ok((user, token)) => {
            info!("Login con Google exitoso para usuario: {}", user.email);
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
            error!("Error en google_login: {:?}", e);
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
    claims: Claims,
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
            (StatusCode::OK, Json(json!({
                "id": row.get::<i32, _>("user_id"),
                "email": row.get::<String, _>("email"),
                "first_name": row.get::<String, _>("first_name"),
                "last_name": row.get::<String, _>("last_name"),
                "role_id": row.get::<i32, _>("role_id"),
                "role_name": row.get::<String, _>("role_name"),
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
    
    let target_user_role: i32 = sqlx::query_scalar("SELECT role_id FROM users WHERE user_id = $1")
        .bind(target_id)
        .fetch_optional(&*state.auth_service.pool)
        .await
        .map_err(|_| AppError::DatabaseError)?
        .ok_or(AppError::BadRequest)?;

    if claims.role == 2 {
        if target_user_role != 1 {
            error!("Admin {} intentó editar a un no-usuario (Rol {})", claims.sub, target_user_role);
            return Err(AppError::Unauthorized);
        }
        if let Some(new_role) = payload.role_id {
            if new_role != 1 { return Err(AppError::Unauthorized); }
        }
    } else if claims.role == 3 {
        // El SUPER_ADMIN (3) puede editar a cualquiera (1 o 2)
    } else {
        if target_id != claims.sub || payload.role_id.is_some() {
            return Err(AppError::Unauthorized);
        }
    }

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
    .bind(payload.first_name).bind(payload.last_name)
    .bind(payload.profile_info).bind(payload.email)
    .bind(claims.role).bind(payload.role_id).bind(target_id)
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

#[utoipa::path(
    get,
    path = "/auth/users",
    params(
        ("limit" = Option<i64>, Query, description = "Cantidad de registros"),
        ("offset" = Option<i64>, Query, description = "Desde qué registro empezar")
    ),
    responses(
        (status = 200, description = "Lista de usuarios obtenida", body = [UserListResponse]),
        (status = 403, description = "No autorizado")
    ),
    security(("bearer_auth" = [])),
    tag = "auth"
)]
pub async fn get_all_users(
    State(state): State<AppState>,
    claims: Claims,
    axum::extract::Query(params): axum::extract::Query<PaginationParams>, 
) -> Result<impl IntoResponse, AppError> {
    
    if claims.role != 3 {
        return Err(AppError::Unauthorized);
    }

    let limit = params.limit.unwrap_or(10);
    let offset = params.offset.unwrap_or(0);

    let users = sqlx::query(
        r#"
        SELECT 
            u.user_id, u.email, u.first_name, u.last_name, u.role_id, u.profile_info,
            r.name as role_name
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        ORDER BY u.user_id ASC
        LIMIT $1 OFFSET $2
        "#
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(&*state.auth_service.pool)
    .await
    .map_err(|_| AppError::DatabaseError)?;

    let response: Vec<UserListResponse> = users.iter().map(|row| {
        UserListResponse {
            id: row.get("user_id"),
            email: row.get("email"),
            first_name: row.get("first_name"),
            last_name: row.get("last_name"),
            role_id: row.get("role_id"),
            role_name: row.get("role_name"),
            profile_info: row.get("profile_info"),
        }
    }).collect();

    Ok(Json(response))
}

#[utoipa::path(
    post,
    path = "/auth/change-password",
    request_body = ChangePasswordRequest,
    responses(
        (status = 200, description = "Contraseña cambiada con éxito"),
        (status = 401, description = "Contraseña actual incorrecta"),
    ),
    security(("bearer_auth" = [])),
    tag = "auth"
)]
pub async fn change_password(
    claims: Claims,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<impl IntoResponse, AppError> {
    
    let row = sqlx::query("SELECT password, email FROM users WHERE user_id = $1")
        .bind(claims.sub)
        .fetch_one(&*state.auth_service.pool)
        .await
        .map_err(|_| AppError::DatabaseError)?;

    let current_hash: String = row.get("password");
    let user_email: String = row.get("email");

    use argon2::{PasswordHash, PasswordVerifier, Argon2};
    let parsed_hash = PasswordHash::new(&current_hash).map_err(|_| AppError::DatabaseError)?;

    if Argon2::default()
        .verify_password(payload.old_password.as_bytes(), &parsed_hash)
        .is_err() 
    {
        return Err(AppError::Unauthorized);
    }

    use argon2::password_hash::{PasswordHasher, SaltString};
    use argon2::password_hash::rand_core::OsRng;
    let salt = SaltString::generate(&mut OsRng);
    let new_hashed_password = Argon2::default()
        .hash_password(payload.new_password.as_bytes(), &salt)
        .map_err(|_| AppError::DatabaseError)?
        .to_string();

    sqlx::query("UPDATE users SET password = $1 WHERE user_id = $2")
        .bind(new_hashed_password)
        .bind(claims.sub)
        .execute(&*state.auth_service.pool)
        .await
        .map_err(|_| AppError::DatabaseError)?;

    let email_req = crate::dto::email_request::EmailRequest {
        to: user_email,
        subject: "Seguridad: Tu contraseña ha cambiado".to_string(),
        body: "Hola, te informamos que tu contraseña ha sido actualizada. Si no fuiste tú, contacta a soporte.".to_string(),
    };

    if let Err(e) = state.recovery_service.email_service.send_email(email_req).await {
        error!("Error enviando correo de seguridad: {:?}", e);
    }

    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Contraseña actualizada" }))))
}