"""Database configuration and session management."""
from uuid import uuid4
from typing import AsyncGenerator

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import get_settings
from app.core.supabase import get_supabase_db_url, is_supabase_configured

settings = get_settings()

def get_database_url() -> str:
    """Get database URL based on configuration."""
    if settings.APP_ENV == "test":
        return settings.DATABASE_URL or "sqlite+aiosqlite:///:memory:"

    if settings.SUPABASE_DB_URL:
        # Use provided URL, convert to asyncpg format if needed
        url = settings.SUPABASE_DB_URL
        if url.startswith("postgresql://") and "asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://")
        return url
    
    # Fallback to constructed Supabase URL
    supabase_url = get_supabase_db_url()
    if supabase_url:
        return supabase_url
    
    # Force Supabase outside tests - no local fallback
    raise ValueError("Supabase not configured. Please set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env")

# Always use Supabase (no local SQLite/Postgres fallback)
database_url = get_database_url()


def is_transaction_pooler_url(url: str) -> bool:
    """Return true when the URL points at a PgBouncer-style pooler."""
    return "pooler.supabase.com" in url or ":6543" in url


def get_asyncpg_connect_args(url: str) -> dict:
    """Connection args needed for asyncpg through Supabase transaction pooler."""
    if not is_transaction_pooler_url(url):
        return {}

    return {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
    }


# Create async engine with proper connection arguments
if database_url.startswith("sqlite"):
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        future=True,
    )
elif is_transaction_pooler_url(database_url):
    # Use connection pooler settings for Supabase
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        future=True,
        poolclass=pool.NullPool,
        connect_args=get_asyncpg_connect_args(database_url),
    )
else:
    # Use default settings for local database
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        future=True,
    )

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

