from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Class-based Config is deprecated in Pydantic v2 and removed in v3
    model_config = SettingsConfigDict( env_file="../../.env" )

    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = 'HS256'
    access_token_expire_minutes: int = 30
    anthropic_api_key: str
    anthropic_base_url: str = "https://api.anthropic.com"
    ai_model: str = "claude-haiku-4-5-20251001"
    # OAuth client ID issued by Google Cloud Console. The backend needs it to
    # confirm an ID token was minted for *our* app and not somebody else's.
    google_client_id: str

settings = Settings()