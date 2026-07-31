from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: SecretStr | None = None
    openai_model: str = "gpt-5.4-mini"
    openai_base_url: str | None = None
    request_timeout_seconds: float = 45.0
    allowed_origins: str = "*"

    @property
    def cors_origins(self) -> list[str]:
        if not self.allowed_origins or self.allowed_origins.strip() == "*":
            return ["*"]
        origins = [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        return origins if origins else ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
