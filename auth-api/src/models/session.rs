use serde::{Serialize, Deserialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use std::net::IpAddr;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: i32,
    pub user_id: i32,
    pub refresh_token_hash: String,
    pub ip_address: Option<IpAddr>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}