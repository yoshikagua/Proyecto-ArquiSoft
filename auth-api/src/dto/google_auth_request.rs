use serde::Deserialize;
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct GoogleAuthRequest {
    /// ID token (JWT) emitido por Google Identity Services
    pub credential: String,
}
