use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

// Definimos los parámetros de búsqueda
#[derive(Deserialize, ToSchema)]
pub struct PaginationParams {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

// Definimos la respuesta (Esto es lo que te faltaba)
#[derive(Serialize, ToSchema)]
pub struct UserListResponse {
    pub id: i32,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role_id: i32,
    pub role_name: String,
    pub profile_info: Option<String>,
}
