use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub user_id: i32,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub profile_info: String,
    pub role_id: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}