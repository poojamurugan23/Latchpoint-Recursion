from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Single config variable — swap this for a Postgres URL later, nothing else changes.
    DATABASE_URL: str = "sqlite:///./latchpoint.db"

    JWT_SECRET_KEY: str = "latchpoint-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]


settings = Settings()
