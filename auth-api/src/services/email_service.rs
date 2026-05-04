use crate::dto::email_request::EmailRequest;
use crate::errors::email_error::EmailError;
use crate::config::email_config::EmailConfig;
use reqwest::Client;
use serde_json::json;

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

        let response = self.client
            .post(&self.notification_url)
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