from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Core
    app_name: str = "OpenVitae"
    environment: str = "development"

    # Database
    database_url: str = "postgresql+psycopg2://openvitae:openvitae@localhost:5432/openvitae"

    # Auth / JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # Seed admin (created on first startup if no users exist)
    admin_email: str = "admin@openvitae.local"
    admin_password: str = "changeme"

    # Object storage (S3-compatible / MinIO)
    s3_endpoint_url: str = "http://localhost:9000"
    s3_public_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "openvitae"
    s3_secret_key: str = "openvitae-secret"
    s3_bucket: str = "openvitae"
    s3_region: str = "us-east-1"
    presigned_url_expire_seconds: int = 60 * 60

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
