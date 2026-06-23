from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = 'HS256'
    access_token_expire_minutes: int = 30
    anthropic_api_key: str
    anthropic_base_url: str = "https://api.anthropic.com"
    ai_model: str = "claude-haiku-4-5-20251001"
    openclaw_base_url: str = "http://127.0.0.1:18789"
    openclaw_api_key: str

    class Config:
        env_file = "../../.env"

settings = Settings() 