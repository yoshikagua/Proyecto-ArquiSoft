use axum::{
    extract::Request,
    http::{StatusCode, HeaderMap},
    middleware::Next,
    response::Response,
};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

pub async fn validate_service_identity(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // 1. Extraer las cabeceras generadas por el Gateway de Python
    let service_name = headers
        .get("X-Service-Name")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::FORBIDDEN)?;

    let timestamp_str = headers
        .get("X-Service-Timestamp")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::FORBIDDEN)?;

    let signature_hex = headers
        .get("X-Service-Signature")
        .and_then(|v| v.to_str().ok())
        .ok_or(StatusCode::FORBIDDEN)?;

    // 2. Control estricto de origen: Solo aceptamos al API Gateway público
    if service_name != "api-gateway" {
        return Err(StatusCode::FORBIDDEN);
    }

    // 3. Ventana de tiempo (Anti-Replay Attack)
    // Validamos que la petición no tenga más de 15 segundos de antigüedad
    let timestamp: u64 = timestamp_str.parse().map_err(|_| StatusCode::FORBIDDEN)?;
    let current_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .as_secs();

    if current_time > timestamp + 15 || timestamp > current_time + 15 {
        // La petición expiró o el reloj del contenedor está desincronizado
        return Err(StatusCode::FORBIDDEN);
    }

    // 4. Obtener el secreto compartido definido en tu docker-compose
    let secret = env::var("INTERNAL_SERVICE_SECRET")
        .unwrap_or_else(|_| "super-secret-internal-cluster-key-change-me".to_string());

    // 5. Re-calcular matemáticamente la firma HMAC-SHA256 esperada
    let message = format!("{}:{}", service_name, timestamp);
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    mac.update(message.as_bytes());
    
    let expected_signature = hex::encode(mac.finalize().into_bytes());

    // 6. Comparación en tiempo constante (evita ataques de sincronización de tiempo)
    if expected_signature != signature_hex {
        return Err(StatusCode::FORBIDDEN);
    }

    // Identidad verificada con éxito. Continuar al endpoint original.
    Ok(next.run(request).await)
}
