"""Database configuration and session management."""
from typing import AsyncGenerator

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

# Create async engine with proper connection arguments
if database_url.startswith("sqlite"):
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        future=True,
    )
elif "pooler.supabase.com" in database_url:
    # Use connection pooler settings for Supabase
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        future=True,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        }
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

