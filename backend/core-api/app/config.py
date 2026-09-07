from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central config, overridable via environment variables or a .env file
    (see .env.example). Swapping DATABASE_URL to a Postgres DSN is the
    only change needed to move this off SQLite.
    """

    database_url: str = "sqlite:///./cloudmind.db"
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
