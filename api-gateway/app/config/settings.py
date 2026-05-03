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
    
    # URL de servicios (Nombres de servicio en Docker)
    user_api_url: str = "http://auth-api:3000" # Asumiendo el contenedor de Rust
    metadata_api_url: str = "http://metadata-api:8000/storage"
    files_api_url: str = "http://files-api:8000" # Ajustado al puerto interno común
    frontend_url: str = "http://localhost:8080"
    
    # Puerto del Gateway
    gateway_port: int = 8000


settings = Settings()
