import os
import secrets
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Egg Billing System API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Supabase / Render: set DATABASE_URL in environment variables
    # Format: postgresql://postgres.[ref]:[password]@[host]:5432/postgres
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:admin%40123@localhost:5432/billsystem",
    )

    # Strong secret key — MUST be set in Render env vars for production
    SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_hex(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    ENABLE_DOCS: bool = os.getenv("ENABLE_DOCS", "false").lower() == "true"

    # Comma-separated list — add your Vercel/Netlify frontend URL here
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    )

    # Render sets PORT env var automatically
    PORT: int = int(os.getenv("PORT", "8000"))

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
