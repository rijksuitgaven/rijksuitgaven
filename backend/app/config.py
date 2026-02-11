"""
Application configuration using environment variables.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Rijksuitgaven API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Supabase (PostgreSQL)
    database_url: str = ""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate required DATABASE_URL at initialization
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")

    # Typesense
    typesense_host: str = ""
    typesense_api_key: str = ""
    typesense_protocol: str = "https"
    typesense_port: int = 443

    # BFF shared secret (empty = disabled, for backwards compatibility during rollout)
    bff_secret: str = ""

    # CORS origins - default to production domains only
    # For development, set ENV=development or DEBUG=true to include localhost
    cors_origins: list[str] = []

    def get_cors_origins(self) -> list[str]:
        """Get CORS origins based on environment - localhost only in development."""
        production_origins = [
            "https://beta.rijksuitgaven.nl",
            "https://rijksuitgaven.nl",
            "https://www.rijksuitgaven.nl",
        ]

        # Include localhost only in development mode
        if self.debug or os.environ.get("ENV", "").lower() == "development":
            return [
                "http://localhost:3000",
                "http://localhost:3001",
                *production_origins,
            ]

        return production_origins

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
