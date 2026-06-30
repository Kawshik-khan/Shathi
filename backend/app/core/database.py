"""Database configuration and session management."""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import get_settings
from app.core.supabase import get_supabase_db_url, is_supabase_configured

settings = get_settings()

def get_database_url() -> str:
    """Get database URL based on configuration."""
    if settings.SUPABASE_DB_URL:
        # Use provided URL, convert to asyncpg format if needed
        url = settings.SUPABASE_DB_URL
        if url.startswith("postgresql://") and "asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://")
        return url

    if settings.DATABASE_URL:
        url = settings.DATABASE_URL
        if url.startswith("postgresql://") and "asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://")
        return url

    # Fallback to constructed Supabase URL
    supabase_url = get_supabase_db_url()
    if supabase_url:
        return supabase_url

    raise RuntimeError(
        "Database is not configured. Set SUPABASE_DB_URL or DATABASE_URL "
        "to a reachable Supabase/Postgres database."
    )


def get_asyncpg_connect_args(url: str | None = None) -> dict:
    """Return asyncpg connect_args needed for the current DSN.

    Used by both the SQLAlchemy engine and ``alembic/env.py`` so
    pgbouncer-aware options travel with the URL everywhere we open
    a connection. The pgbouncer transaction pool that fronts
    Supabase Postgres doesn't tolerate asyncpg's
    prepared-statement cache (each pooled transaction would reuse
    another session's plan and fail with ``prepared statement
    does not exist``), so we disable both caches when we detect
    the pooler host.
    """
    import ssl

    target = url if url is not None else get_database_url()
    if "pooler.supabase.com" in target:
        # Supabase's pooler serves a chain terminated by
        # ``Supabase Root 2021 CA`` (self-signed, not in the system
        # trust store). Without pinning the root, the handshake fails
        # with ``CERTIFICATE_VERIFY_FAILED: self-signed certificate in
        # certificate chain``. Supabase's own docs say: "PowerBI Service
        # does not natively trust Supabase's self-signed CA certificates.
        # Download the CA certificate from the Database Settings" â€” we
        # do exactly that, fetching it from the pooler's own TLS chain
        # (so the bytes are guaranteed to be the live, current root) and
        # caching it under ``supabase-root-2021-ca.pem`` next to this
        # module. See scripts/check_supabase.py for the extractor.
        from pathlib import Path

        ctx = ssl.create_default_context()
        if settings.DATABASE_SSL_VERIFY:
            ca_path = Path(__file__).resolve().parent.parent.parent / "supabase-root-2021-ca.pem"
            if ca_path.is_file():
                ctx.load_verify_locations(cafile=str(ca_path))
        else:
            # Local-dev escape hatch. Windows + Python 3.14 sometimes
            # refuses a self-signed CA even when the file is present and
            # well-formed (the verifier insists on keyUsage on every
            # intermediate in the chain). For dev only, skip host
            # verification — the connection is still encrypted and the
            # password in the DSN is never sent before the handshake
            # completes.
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
        return {
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "ssl": ctx,
        }
    return {}


# Use Supabase database URL if configured, otherwise fall back to local database
database_url = get_database_url()

# Create async engine with proper connection arguments
# (single source of truth for the pooler-friendly options — also
# consumed by alembic/env.py via get_asyncpg_connect_args).
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    future=True,
    connect_args=get_asyncpg_connect_args(database_url),
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
