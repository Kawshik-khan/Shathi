"""Main FastAPI application entry point."""
import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

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

    # Fail fast on bad production config — see Settings.validate_production
    # for the exact checks. We surface errors as RuntimeError so the
    # container restart loop catches it and the deploy fails instead of
    # silently serving traffic with the wrong posture.
    try:
        settings.validate_production()
    except RuntimeError as exc:
        logger.error("Refusing to start: %s", exc)
        raise

    app.state.pinecone_index = None
    app.state.redis = None

    if settings.PINECONE_API_KEY:
        try:
            from pinecone import Pinecone

            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            app.state.pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
            # Warm the index connection so the first /health check and the first
            # chat retrieval don't pay the cold-call cost (DNS + TCP + TLS +
            # initial REST round-trip; on this host that can be ~2-5s, well over
            # the 1s budget the health probe gives itself). Mirror the warmup
            # pattern from the Pinecone MCP server. Failure here is non-fatal —
            # the index still works, the first request just pays the cost once.
            try:
                await asyncio.to_thread(app.state.pinecone_index.describe_index_stats)
            except Exception as warm_exc:
                logger.warning("Pinecone warmup failed (non-fatal): %s", warm_exc)
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
    # Close shared embedding HTTP clients (HF fallback httpx + AsyncOpenAI).
    from app.services.memory import close_embedding_clients
    await close_embedding_clients()


def create_application() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="Shathi API",
        description="AI Mental Wellness Companion Backend",
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )
    
    # Middleware
    #
    # CORS is pinned to explicit methods/headers/expose_headers (rather
    # than ``["*"]``) because FastAPI's CORSMiddleware will refuse wildcards
    # when ``allow_credentials=True`` per the CORS spec — and credentialed
    # CORS is exactly what 1.3's HttpOnly cookie flow needs. Validate
    # at startup via ``Settings.validate_production`` to keep the two
    # in sync.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=settings.cors_allow_methods_list,
        allow_headers=settings.cors_allow_headers_list,
        expose_headers=settings.cors_expose_headers_list,
        max_age=settings.CORS_MAX_AGE_SECONDS,
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

    # Avatar static files. Resolve to an absolute path so the cwd at
    # server start doesn't matter. Mount lazily — the directory may not
    # exist on a fresh checkout until the first upload happens, so
    # fall back to a known-existing dir if needed (the StaticFiles mount
    # would otherwise raise on startup).
    avatar_dir = Path(settings.AVATAR_STORAGE_DIR).expanduser()
    if not avatar_dir.is_absolute():
        avatar_dir = (Path.cwd() / avatar_dir).resolve()
    avatar_dir.mkdir(parents=True, exist_ok=True)
    app.mount(
        settings.AVATAR_PUBLIC_BASE_URL,
        StaticFiles(directory=str(avatar_dir)),
        name="avatars",
    )

    @app.get("/", tags=["health"])
    async def root_status():
        return {
            "status": "ok",
            "service": "shathi-api",
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
                # Cold calls to Pinecone's REST endpoint can take 2-5s on the
                # first hit (DNS + TCP + TLS + initial round-trip). We warm the
                # connection at startup so steady-state calls are fast, but
                # keep the probe budget generous enough that a transient
                # re-cold (after a long idle) doesn't make /health flap.
                async with asyncio.timeout(5.0):
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
            "service": "shathi-api",
            "pinecone": pinecone_status,
            "redis": redis_status,
        }
    
    return app


app = create_application()

