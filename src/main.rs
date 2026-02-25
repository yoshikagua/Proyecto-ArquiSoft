use axum::{
    routing::{post, get},
    Json, Router, response::{IntoResponse, Response},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, Header, EncodingKey};
use chrono::{Utc, Duration};

// 1. Modelos de datos
#[derive(Deserialize)]
struct LoginPayload {
    username: String,
    password: String,
}

#[derive(Serialize)]
struct AuthResponse {
    token: String,
    token_type: String,
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String, // ID del usuario (subject)
    exp: usize,  // Expiración (Unix timestamp)
}

// 2. Clave secreta para firmar los tokens (¡En producción usa variables de entorno!)
const JWT_SECRET: &[u8] = b"mi_secreto_super_seguro_123";

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/api/register", post(register))
        .route("/api/login", post(login));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("🔐 Auth Server corriendo en http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}

// Handler de Registro (Simulado)
async fn register(Json(payload): Json<LoginPayload>) -> impl IntoResponse {
    println!("Nuevo usuario registrado: {}", payload.username);
    (StatusCode::CREATED, format!("Usuario {} creado", payload.username))
}

// Handler de Login
async fn login(Json(payload): Json<LoginPayload>) -> Result<Json<AuthResponse>, (StatusCode, String)> {
    // Simulación: En un caso real, aquí consultarías la DB y verificarías el hash del password
    if payload.username == "admin" && payload.password == "1234" {
        
        // Crear la fecha de expiración (24 horas desde ahora)
        let expiration = Utc::now()
            .checked_add_signed(Duration::hours(24))
            .expect("valid timestamp")
            .timestamp() as usize;

        let claims = Claims {
            sub: payload.username,
            exp: expiration,
        };

        // Firmar el token
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(JWT_SECRET),
        ).map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Error al generar token".to_string()))?;

        Ok(Json(AuthResponse {
            token,
            token_type: "Bearer".to_string(),
        }))
    } else {
        Err((StatusCode::UNAUTHORIZED, "Credenciales inválidas".to_string()))
    }
}
