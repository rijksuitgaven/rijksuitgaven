"""
Application configuration using environment variables.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Rijksuitgaven API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Supabase (PostgreSQL)
    database_url: str = ""

    # Typesense
    typesense_host: str = ""
    typesense_api_key: str = ""
    typesense_protocol: str = "https"
    typesense_port: int = 443

    # CORS - localhost included for development (local-only, minimal security risk)
    # Override via CORS_ORIGINS env var in production if needed
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://beta.rijksuitgaven.nl",
        "https://rijksuitgaven.nl",
        "https://www.rijksuitgaven.nl",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
