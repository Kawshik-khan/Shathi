"""Database configuration for Python 3.14 (SQLite version)."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import get_settings

settings = get_settings()

# Use SQLite for Python 3.14 compatibility
# Format: sqlite+aiosqlite:///path/to/db.sqlite
DATABASE_URL = settings.DATABASE_URL
if "postgresql" in DATABASE_URL:
    # Fallback to SQLite if user hasn't updated env
    DATABASE_URL = "sqlite+aiosqlite:///./sathi.db"

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

