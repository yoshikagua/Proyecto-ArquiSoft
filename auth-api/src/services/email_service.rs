use crate::dto::email_request::EmailRequest;
use crate::errors::email_error::EmailError;
use crate::config::email_config::EmailConfig;
 use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

#[derive(Debug, Clone)]
pub struct EmailService {
    mailer: AsyncSmtpTransport<Tokio1Executor>,
    from: String,
}

impl EmailService {
    pub fn new(config: EmailConfig) -> Result<Self, EmailError> {
        // Mailhog solo soporta SMTP plano (sin TLS)
        let mailer = AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&config.smtp_host)
            .port(config.smtp_port)
            .build();
        Ok(Self {
            mailer,
            from: config.from,
        })
    }

    pub async fn send_email(
        &self,
        request: EmailRequest,
    ) -> Result<(), EmailError> {
        let email = Message::builder()
            .from(self.from.parse().map_err(|_| EmailError::ConfigError)?)
            .to(request.to.parse().map_err(|_| EmailError::ConfigError)?)
            .subject(request.subject)
            .body(request.body)
            .map_err(|_| EmailError::ConfigError)?;

        self.mailer.send(email).await.map_err(|e| {
            tracing::error!("Error enviando email: {:?}", e);
            EmailError::SendError
        })?;
        Ok(())
    }
}