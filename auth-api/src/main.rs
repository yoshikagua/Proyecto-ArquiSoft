pub mod state;
pub mod handlers;
pub mod services;
pub mod dto;
pub mod errors;
pub mod models;

use axum::{
    routing::{post, put,get},
    Router,
};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use crate::dto::{
    register_request::RegisterRequest, 
    recovery_request::RecoveryRequest, 
    verify_recovery_code_request::VerifyRecoveryCodeRequest,
    login_request::LoginRequest 
};
#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::auth_handler::register,
        handlers::auth_handler::recover_password,
        handlers::auth_handler::verify_recovery_code,
        handlers::auth_handler::login,
        handlers::auth_handler::logout,
        handlers::auth_handler::get_current_user,
        handlers::auth_handler::update_user,
        handlers::auth_handler::reset_password,
        handlers::auth_handler::get_all_users,
        handlers::auth_handler::change_password
    ),
    components(schemas(
        RegisterRequest, 
        RecoveryRequest, 
        VerifyRecoveryCodeRequest,
        LoginRequest,
        crate::dto::update_user_request::UpdateUserRequest,
        crate::dto::update_user_request::ResetPasswordRequest,
        crate::handlers::auth_handler::UserListResponse,
        crate::dto::change_password_request::ChangePasswordRequest
    )),
    tags(
        (name = "auth", description = "Authentication endpoints")
    )
)]
struct ApiDoc;
use dotenv::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;
use std::net::SocketAddr;
// use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
mod config;

use state::AppState;
use services::{
    auth_service::AuthService,
    recovery_service::RecoveryService,
    email_service::EmailService,
};
use std::sync::Arc;


async fn health_check() -> &'static str {
    "healthy"
}



#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "auth_api=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    dotenv().ok();

    let database_url =
        env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let db_pool = Arc::new(
        PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?
    );


    // ---- SERVICES ----
    let email_config = crate::config::email_config::EmailConfig {
        smtp_host: env::var("MAIL_SMTP_HOST").unwrap_or_else(|_| "localhost".to_string()),
        smtp_port: env::var("MAIL_SMTP_PORT").ok().and_then(|v| v.parse().ok()).unwrap_or(1025),
        from: env::var("MAIL_FROM").unwrap_or_else(|_| "noreply@localhost".to_string()),
    };
    let email_service = EmailService::new(email_config).expect("Error configurando EmailService");

    let auth_service = AuthService {
        pool: db_pool.clone(),
        email_service: email_service.clone(),
    };

    let recovery_service = RecoveryService {
        pool: db_pool.clone(),
        email_service,
    };

    let app_state = AppState {
        auth_service,
        recovery_service,
    };

    // ---- ROUTER ----
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/auth/register", post(handlers::auth_handler::register))
        .route("/auth/login", post(handlers::auth_handler::login))
        .route("/auth/logout", post(handlers::auth_handler::logout))
        .route("/auth/recover", post(handlers::auth_handler::recover_password))
        .route("/auth/verify-recovery-code", post(handlers::auth_handler::verify_recovery_code))
        .route("/auth/me", axum::routing::get(handlers::auth_handler::get_current_user))
        .route("/auth/users/:id", put(handlers::auth_handler::update_user))
        .route("/auth/reset-password", post(handlers::auth_handler::reset_password))
        .route("/auth/users", get(handlers::auth_handler::get_all_users))
        .route("/auth/change-password", post(handlers::auth_handler::change_password))

        .merge(SwaggerUi::new("/swagger").url("/api-doc/openapi.json", ApiDoc::openapi()))
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
