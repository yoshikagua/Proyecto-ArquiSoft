from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación API Gateway"""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False)
    
    # FastAPI
    app_name: str = "API Gateway"
    debug: bool = False
    
    # Seguridad (JWT)
    jwt_secret: str = "your-default-secret-key-change-me"
    jwt_algorithm: str = "HS256"
    
    # NUEVO: Seguridad Canal Interno (Service-to-Service)
    internal_service_secret: str = "super-secret-internal-cluster-key-change-me"
    internal_service_name: str = "api-gateway"
    
    # URL de servicios (Nombres de servicio en Docker)
    user_api_url: str = "http://auth-api:3000" # Asumiendo el contenedor de Rust
    metadata_api_url: str = "http://metadata-api:8000/storage"
    files_api_url: str = "http://files-api:8000" # Ajustado al puerto interno común
    notification_url: str = "http://notification-producer:8000"
    payments_url: str = "http://payments_app:3000"
    frontend_url: str = "http://localhost:8080"
    
    # Puerto del Gateway
    gateway_port: int = 8000


settings = Settings()
