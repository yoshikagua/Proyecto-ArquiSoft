from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación API Gateway"""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)
    
    # FastAPI
    app_name: str = "API Gateway"
    debug: bool = False
    
    # URL de servicios
    user_api_url: str = "http://localhost:3000"
    music_storage_url: str = "http://localhost:8001/storage"
    frontend_url: str = "http://localhost:8080"
    
    # Puerto del Gateway
    gateway_port: int = 8000


settings = Settings()
