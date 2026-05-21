"""Main FastAPI application entry point."""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import get_settings
from app.core.errors import (
    RateLimitMiddleware,
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.logging import configure_logging
from app.api.router import api_router
from app.core.database import Base, engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL)
    app.state.pinecone_index = None
    app.state.redis = None

    if settings.PINECONE_API_KEY:
        try:
            from pinecone import Pinecone

            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            app.state.pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
        except Exception as exc:
            logger.warning("Pinecone init failed: %s; vector context disabled", exc)

    try:
        import redis.asyncio as aioredis

        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        await redis_client.ping()
        app.state.redis = redis_client
    except Exception as exc:
        logger.warning("Redis init failed: %s; user context cache disabled", exc)
    
    # Production schema changes are handled by Alembic migrations.
    if settings.AUTO_CREATE_TABLES:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Shutdown
    if app.state.redis:
        await app.state.redis.aclose()
    await engine.dispose()


def create_application() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="Sathi API",
        description="AI Mental Wellness Companion Backend",
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )
    
    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(RateLimitMiddleware)

    if settings.SENTRY_DSN:
        import sentry_sdk

        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.APP_ENV,
            traces_sample_rate=0.1,
        )

    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
    
    # API Routes
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/", tags=["health"])
    async def root_status():
        return {
            "status": "ok",
            "service": "sathi-api",
            "health": "/health",
        }
    
    @app.get("/health", tags=["health"])
    async def health_check():
        async def check_redis() -> str:
            redis_client = getattr(app.state, "redis", None)
            if not redis_client:
                return "unavailable"
            try:
                async with asyncio.timeout(1.0):
                    await redis_client.ping()
                return "connected"
            except Exception:
                return "unavailable"

        async def check_pinecone() -> str:
            pinecone_index = getattr(app.state, "pinecone_index", None)
            if not pinecone_index:
                return "unavailable"
            try:
                async with asyncio.timeout(1.0):
                    await asyncio.to_thread(pinecone_index.describe_index_stats)
                return "connected"
            except Exception:
                return "unavailable"

        redis_status, pinecone_status = await asyncio.gather(
            check_redis(),
            check_pinecone(),
        )

        return {
            "status": "healthy",
            "service": "sathi-api",
            "pinecone": pinecone_status,
            "redis": redis_status,
        }
    
    return app


app = create_application()

