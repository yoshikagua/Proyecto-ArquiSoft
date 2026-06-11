pub mod state;
pub mod handlers;
pub mod services;
pub mod dto;
pub mod errors;
pub mod models;

use axum::{
    routing::{post, put, get},
    Router,
    middleware, // Requerido para middleware::from_fn
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
        handlers::auth_handler::google_login,
        handlers::auth_handler::logout,
        handlers::auth_handler::get_current_user,
        handlers::auth_handler::update_user,
        handlers::auth_handler::reset_password,
        handlers::auth_handler::get_all_users,
        handlers::change_password
    ),
    components(schemas(
        RegisterRequest, 
        RecoveryRequest, 
        VerifyRecoveryCodeRequest,
        LoginRequest,
        crate::dto::google_auth_request::GoogleAuthRequest,
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
    google_auth_service::GoogleAuthService,
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
        notification_url: env::var("NOTIFICATION_URL").unwrap_or_else(|_| "http://notification-producer:8000".to_string()),
    };
    let email_service = EmailService::new(email_config).expect("Error configurando EmailService");

    let google_client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
    let google_auth_service = GoogleAuthService::new(google_client_id);

    let auth_service = AuthService {
        pool: db_pool.clone(),
        email_service: email_service.clone(),
        google_auth_service,
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
    // Explicación de la jerarquía:
    // Creamos un sub-enrutador exclusivo para "/auth" al cual le asignamos el middleware.
    // De este modo, las firmas HMAC internas son estrictamente obligatorias solo allí.
    let auth_routes = Router::new()
        .route("/register", post(handlers::auth_handler::register))
        .route("/login", post(handlers::auth_handler::login))
        .route("/google", post(handlers::auth_handler::google_login))
        .route("/logout", post(handlers::auth_handler::logout))
        .route("/recover", post(handlers::auth_password))
        .route("/verify-recovery-code", post(handlers::auth_handler::verify_recovery_code))
        .route("/me", get(handlers::auth_handler::get_current_user))
        .route("/users/:id", put(handlers::auth_handler::update_user))
        .route("/reset-password", post(handlers::auth_handler::reset_password))
        .route("/users", get(handlers::auth_handler::get_all_users))
        .route("/change-password", post(handlers::auth_handler::change_password))
        // Se aplica el middleware de validación únicamente a estas rutas del negocio
        .layer(middleware::from_fn(handlers::service_guard::validate_service_identity));

    let app = Router::new()
        // 1. Rutas del negocio protegidas por HMAC bajo el prefijo "/auth"
        .nest("/auth", auth_routes)
        // 2. Rutas públicas (Libres de verificación HMAC para Health Checks y Swagger de desarrollo)
        .route("/health", get(health_check))
        .merge(SwaggerUi::new("/swagger").url("/api-doc/openapi.json", ApiDoc::openapi()))
        // 3. Compartir el estado global de Axum
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}