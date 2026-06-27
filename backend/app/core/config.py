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
    AUTO_CREATE_TABLES: bool = False
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

    # OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    
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

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Chat optimization
    CHAT_HISTORY_LIMIT: int = 12
    CHAT_HISTORY_FOR_LLM: int = 6  # Trim conversation history sent to the LLM
    # Bound on a single embeddings call. Must be shorter than
    # ``CHAT_PROVIDER_TIMEOUT_MS`` (800ms) so the inner ``asyncio.timeout``
    # inside ``memory.retrieve_memories`` fires before the per-provider
    # budget can. The [redacted] SDK's internal retries are also
    # disabled (max_retries=0 in memory.py) so this timeout is the only
    # thing guarding the call.
    EMBEDDING_TIMEOUT_SECONDS: float = 0.6
    # Embedding vector width. MUST match the Pinecone index dim exactly
    # or upsert/query will fail with ``Vector dimension X does not match
    # the dimension of the index Y`` and the chat path will surface a
    # "Failed to stream message" error on every retrieval. The legacy
    # code assumed 1536 (text-embedding-ada-002); the live index is
    # 1024 (text-embedding-3-small / HF MiniLM-padded). Override via
    # env only if a different index is provisioned.
    EMBEDDING_DIM: int = 1024
    USER_CONTEXT_CACHE_TTL: int = 300

    # Per-provider timeouts (milliseconds). Each provider has its own
    # bound so a slow source can never block the others or the LLM.
    CHAT_PROVIDER_TIMEOUT_MS: int = 800
    # Hard wall-clock ceiling for the whole context build gather. This is a
    # safety net, not the SLA: in the steady state every provider should
    # return at ``CHAT_PROVIDER_TIMEOUT_MS`` and the gather should resolve
    # in ~800 ms. We keep the hard budget comfortably above that so the
    # LLM always has a fair shot at starting to stream, even if Pinecone
    # or the embeddings service is having a bad minute.
    CHAT_CONTEXT_HARD_BUDGET_MS: int = 2500
    CHAT_HEARTBEAT_INTERVAL_MS: int = 250

    # Embedding cache (RAG optimization). LRU is in-process for speed;
    # Redis is shared across workers and avoids repeated paid
    # embedding calls for the same user message across requests.
    EMBEDDING_CACHE_ENABLED: bool = True
    EMBEDDING_CACHE_TTL_SECONDS: int = 3600
    EMBEDDING_CACHE_MAX_ENTRIES: int = 1024

    # Time we wait for the semantic response cache to answer before
    # committing to building full RAG context. A hit here lets us
    # skip the Pinecone call entirely (no memory section, no
    # embedding request).
    RESPONSE_CACHE_RACE_BUDGET_MS: int = 100

    # Memory retrieval tuning. ``MEMORY_SCORE_FLOOR`` drops weak
    # matches unless fewer than ``MEMORY_MIN_KEEP`` survive. The
    # query expansion block bounds how much prior assistant context
    # is mixed into the embedding call.
    MEMORY_TOP_K: int = 3
    MEMORY_SCORE_FLOOR: float = 0.7
    MEMORY_MIN_KEEP: int = 2
    MEMORY_QUERY_MAX_CHARS: int = 400
    MEMORY_QUERY_TURN_CHARS: int = 120
    MEMORY_QUERY_LAST_TURNS: int = 2

    # Per-section Redis cache TTLs (seconds).
    CHAT_CACHE_TTL_PROFILE: int = 1800   # 30 min
    CHAT_CACHE_TTL_MOOD: int = 600       # 10 min
    CHAT_CACHE_TTL_JOURNAL: int = 600    # 10 min
    CHAT_CACHE_TTL_SLEEP: int = 300      # 5 min
    CHAT_CACHE_TTL_HABIT: int = 900      # 15 min
    CHAT_CACHE_TTL_ACTIVITY: int = 600   # 10 min
    CHAT_CACHE_TTL_INFERRED: int = 600   # 10 min
    CHAT_CACHE_TTL_MEMORY: int = 300     # 5 min

    # Semantic response cache
    RESPONSE_CACHE_ENABLED: bool = True
    RESPONSE_CACHE_NAMESPACE: str = "response-cache"
    RESPONSE_CACHE_SIMILARITY_THRESHOLD: float = 0.95
    
    # Cloudflare KV
    CLOUDFLARE_ACCOUNT_ID: Optional[str] = None
    CLOUDFLARE_KV_NAMESPACE_ID: Optional[str] = None
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,https://localhost:3000"
    
    # Logging
    LOG_LEVEL: str = "INFO"

    # Rate limiting
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    AUTH_RATE_LIMIT_MAX: int = 20
    CHAT_RATE_LIMIT_MAX: int = 60

    # Avatar uploads. AVATAR_STORAGE_DIR controls where avatars land when
    # Supabase storage isn't configured. AVATAR_MAX_BYTES caps the request
    # size; anything bigger is rejected with 413 before we touch disk.
    AVATAR_STORAGE_DIR: str = "uploads/avatars"
    AVATAR_PUBLIC_BASE_URL: str = "/static/avatars"
    AVATAR_MAX_BYTES: int = 2 * 1024 * 1024  # 2 MiB
    AVATAR_ALLOWED_MIME: str = "image/jpeg,image/png,image/webp"

    # Monitoring
    SENTRY_DSN: Optional[str] = None
    
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

    def validate_production(self) -> None:
        """Fail-fast checks for production deployments.

        Called once at lifespan startup so a misconfigured deploy doesn't
        silently serve traffic with the wrong posture. The checks are
        intentionally noisy: the goal is to break the deploy, not to
        degrade gracefully into a less-secure mode.
        """
        if not self.is_production:
            return
        issues: list[str] = []
        if not self.SECRET_KEY or self.SECRET_KEY == "change-me-in-production":
            issues.append("SECRET_KEY must be set to a strong random value")
        if not self.effective_database_url:
            issues.append("DATABASE_URL or SUPABASE_DB_URL is required")
        bad_origins = [
            o
            for o in self.cors_origins_list
            if o
            and (
                o.startswith("http://localhost")
                or o.startswith("http://127.")
                or "*" in o
            )
        ]
        if bad_origins:
            issues.append(
                f"CORS_ORIGINS must not contain localhost or wildcards in "
                f"production (found: {bad_origins})"
            )
        if not self.SUPABASE_URL and not self.DATABASE_URL:
            issues.append("SUPABASE_URL or DATABASE_URL is required")
        if issues:
            raise RuntimeError(
                "Production configuration invalid:\n  - " + "\n  - ".join(issues)
            )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

