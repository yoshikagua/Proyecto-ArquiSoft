use serde::Deserialize;
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct VerifyRecoveryCodeRequest {
    pub email: String,
    pub code: String,
}