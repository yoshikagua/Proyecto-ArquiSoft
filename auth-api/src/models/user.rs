use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub user_id: i32,
    pub email: String,
    #[serde(skip_serializing)] // No enviar el hash de la clave en el JSON
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub profile_info: Option<String>,
    pub role_id: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}
