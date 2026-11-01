from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    """
    Central config, overridable via environment variables or a .env file
    (see .env.example). Swapping DATABASE_URL to a Postgres DSN is the
    only change needed to move this off SQLite.
    """

    database_url: str = "sqlite:///./cloudmind.db"
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: Literal["HS256"] = "HS256"
    access_token_expire_minutes: int = 60
    environment: str = "development"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    demo_enabled: bool = False
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5"
    kafka_bootstrap_servers: str = ""
    kafka_iam: bool = False
    metrics_scrape_token: str = ""
    retention_days: int = 30
    model_store: str = "./model-artifacts"
    redis_url: str = ""
    auth_rate_limit: int = 30
    aws_region: str = "us-east-1"
    bedrock_model_id: str = ""
    archive_bucket: str = ""
    dynamodb_events_table: str = ""
    opensearch_url: str = ""
    oidc_issuer: str = ""
    oidc_client_id: str = ""
    oidc_client_secret: str = ""
    public_api_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    otel_endpoint: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
