use crate::services::{
    auth_service::AuthService,
    recovery_service::RecoveryService,
};

#[derive(Debug, Clone)]
pub struct AppState {
    pub auth_service: AuthService,
    pub recovery_service: RecoveryService,
}