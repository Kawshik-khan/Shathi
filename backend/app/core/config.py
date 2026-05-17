"""Application configuration settings."""
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings

# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent.parent
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"
        extra = "ignore"
    
    # Application
    APP_ENV: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    
    # Database - Supabase is required (no local SQLite fallback)
    DATABASE_URL: str = ""
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_DB_URL: str = ""
    SUPABASE_DB_PASSWORD: str = ""
    
    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OpenAI (secondary/fallback)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    
    # Default AI Model
    DEFAULT_AI_MODEL: str = "llama-3.3-70b"
    
    # Hugging Face Router (primary)
    HF_API_TOKEN: Optional[str] = None
    HF_TOKEN: Optional[str] = None  # Alias — either name works
    HF_ROUTER_BASE_URL: str = "https://router.huggingface.co/v1"
    
    # Model IDs (HF Router format)
    HF_LLAMA_MODEL: str = "meta-llama/Llama-3.3-70B-Instruct:groq"
    HF_DEEPSEEK_MODEL: str = "deepseek-ai/DeepSeek-V4-Pro:novita"
    
    # Legacy Mistral model (deprecated)
    HF_MISTRAL_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.3"
    
    # Pinecone
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: str = "sathi-memories"
    PINECONE_ENVIRONMENT: str = "us-east-1"
    
    # Cloudflare KV
    CLOUDFLARE_ACCOUNT_ID: Optional[str] = None
    CLOUDFLARE_KV_NAMESPACE_ID: Optional[str] = None
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,https://localhost:3000"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.APP_ENV == "production"
    
    @property
    def effective_database_url(self) -> str:
        """Get the effective database URL, preferring Supabase if configured."""
        if self.SUPABASE_DB_URL:
            return self.SUPABASE_DB_URL
        return self.DATABASE_URL


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

