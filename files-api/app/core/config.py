from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MINIO_ENDPOINT: str
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    BUCKET_NAME: str = "scores"

    class Config:
        env_file = ".env"


settings = Settings()
