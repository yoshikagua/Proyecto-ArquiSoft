// auth-api/src/services/email_service.rs
use crate::dto::email_request::EmailRequest;
use crate::errors::email_error::EmailError;
use crate::config::email_config::EmailConfig;
use reqwest::Client;
use serde_json::json;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone)]
pub struct EmailService {
    client: Client,
    notification_url: String,
}

impl EmailService {
    pub fn new(config: EmailConfig) -> Result<Self, EmailError> {
        Ok(Self {
            client: Client::new(),
            notification_url: config.notification_url,
        })
    }

    pub async fn send_email(
        &self,
        request: EmailRequest,
    ) -> Result<(), EmailError> {
        let payload = json!({
            "email": request.to,
            "asunto": request.subject,
            "mensaje": request.body
        });

        // --- GENERACIÓN DE CABECERAS PARA CANAL SEGURO ---
        // 1. Obtener timestamp actual en segundos
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| {
                tracing::error!("Error de tiempo del sistema: {:?}", e);
                EmailError::SendError
            })?
            .as_secs();
        
        let timestamp_str = timestamp.to_string();
        let service_name = "auth-api";

        // 2. Obtener secreto del entorno
        let secret = env::var("INTERNAL_SERVICE_SECRET")
            .unwrap_or_else(|_| "super-secret-internal-cluster-key-change-me".to_string());

        // 3. Crear el mensaje y firmarlo mediante HMAC-SHA256
        let message = format!("{}:{}", service_name, timestamp_str);
        let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).map_err(|e| {
            tracing::error!("Error inicializando estructura HMAC: {:?}", e);
            EmailError::SendError
        })?;
        mac.update(message.as_bytes());
        let signature_hex = hex::encode(mac.finalize().into_bytes());

        // 4. Inyectar los headers antes de enviar
        let response = self.client
            .post(&self.notification_url)
            .header("X-Service-Name", service_name)
            .header("X-Service-Timestamp", &timestamp_str)
            .header("X-Service-Signature", &signature_hex)
            .json(&payload)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Error conectando con el servicio de notificaciones: {:?}", e);
                EmailError::SendError
            })?;

        if !response.status().is_success() {
            tracing::error!("El servicio de notificaciones respondió con error: {:?}", response.status());
            return Err(EmailError::SendError);
        }

        Ok(())
    }
}
