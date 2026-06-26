"""Confirm Redis and Pinecone outages degrade gracefully.

The app must keep serving traffic when these optional dependencies are
down — Redis backs the user-context cache, Pinecone backs RAG memory
retrieval. The /health endpoint should reflect per-component status
without ever raising on the caller.

We avoid pulling in ``asgi-lifespan`` by driving ``lifespan`` directly:
pre-seed ``app.state``, force the init branches to raise, then exercise
the live ``/health`` route function.
"""
import asyncio
import logging
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.main import app, lifespan
from app.services import memory


class _HealthyRedis:
    def __init__(self):
        self.ping = AsyncMock(return_value=True)
        self.aclose = AsyncMock()


class _HealthyPineconeIndex:
    def describe_index_stats(self):
        return {"namespaces": {}}


class _BrokenPineconeIndex:
    def describe_index_stats(self):
        raise ConnectionError("pinecone unreachable")


class _BrokenRedis:
    async def ping(self):
        raise ConnectionError("redis unreachable")

    async def aclose(self):
        return None


def _fake_settings(**overrides):
    """Build a Settings-shaped SimpleNamespace with safe defaults."""
    base = dict(
        AUTO_CREATE_TABLES=False,
        PINECONE_API_KEY="",
        PINECONE_INDEX_NAME="x",
        REDIS_URL="redis://localhost:6379/0",
        LOG_LEVEL="WARNING",
        APP_ENV="test",
        SECRET_KEY="test-secret-key-with-enough-entropy",
        CORS_ORIGINS="http://localhost:3000",
        is_production=False,
        cors_origins_list=["http://localhost:3000"],
        validate_production=lambda: None,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


@pytest.fixture(autouse=True)
def _isolate(monkeypatch):
    """Default settings shape used by the lifespan. Tests override per-case."""
    monkeypatch.setattr("app.main.get_settings", lambda: _fake_settings())
    dispose = AsyncMock()
    monkeypatch.setattr("app.main.engine", SimpleNamespace(dispose=dispose))

    async def fake_close():
        return None
    monkeypatch.setattr(memory, "close_embedding_clients", fake_close)
    yield


async def _drive_lifespan_once():
    async with lifespan(app):
        pass


def test_health_reports_unavailable_when_redis_init_fails(monkeypatch):
    """Lifespan must not raise when Redis is down, and /health must report it."""
    import redis.asyncio as aioredis

    monkeypatch.setattr(aioredis, "from_url", lambda *a, **kw: _BrokenRedis())

    asyncio.run(_drive_lifespan_once())

    assert app.state.redis is None

    route = next(r for r in app.routes if getattr(r, "path", None) == "/health")
    response = asyncio.run(route.endpoint())
    assert response["status"] == "healthy"
    assert response["redis"] == "unavailable"
    assert response["pinecone"] == "unavailable"


def test_health_reports_unavailable_when_pinecone_init_fails(monkeypatch):
    """Pinecone failure during init must not crash startup."""
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: _fake_settings(PINECONE_API_KEY="test-key"),
    )

    class _BoomPc:
        def __init__(self, api_key=None):
            pass
        def Index(self, name):
            raise ConnectionError("pinecone unreachable during init")

    monkeypatch.setitem(
        __import__("sys").modules, "pinecone", SimpleNamespace(Pinecone=_BoomPc)
    )

    import redis.asyncio as aioredis
    monkeypatch.setattr(aioredis, "from_url", lambda *a, **kw: _HealthyRedis())

    asyncio.run(_drive_lifespan_once())

    assert app.state.pinecone_index is None

    route = next(r for r in app.routes if getattr(r, "path", None) == "/health")
    response = asyncio.run(route.endpoint())
    assert response["status"] == "healthy"
    assert response["pinecone"] == "unavailable"
    assert response["redis"] == "connected"


def test_health_reports_connected_when_both_dependencies_healthy(monkeypatch):
    """Happy path — both connected shows both as connected."""
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: _fake_settings(PINECONE_API_KEY="test-key"),
    )

    healthy_index = _HealthyPineconeIndex()

    class _HealthyPc:
        def __init__(self, api_key=None):
            pass
        def Index(self, name):
            return healthy_index

    monkeypatch.setitem(
        __import__("sys").modules, "pinecone", SimpleNamespace(Pinecone=_HealthyPc)
    )

    import redis.asyncio as aioredis
    monkeypatch.setattr(aioredis, "from_url", lambda *a, **kw: _HealthyRedis())

    asyncio.run(_drive_lifespan_once())

    assert app.state.redis is not None
    assert app.state.pinecone_index is healthy_index

    route = next(r for r in app.routes if getattr(r, "path", None) == "/health")
    response = asyncio.run(route.endpoint())
    assert response["status"] == "healthy"
    assert response["redis"] == "connected"
    assert response["pinecone"] == "connected"


def test_health_marks_pinecone_unavailable_when_index_call_fails(monkeypatch):
    """Index that throws on describe_index_stats must surface as unavailable."""
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: _fake_settings(PINECONE_API_KEY="test-key"),
    )

    class _PcWithBrokenIndex:
        def __init__(self, api_key=None):
            pass
        def Index(self, name):
            return _BrokenPineconeIndex()

    monkeypatch.setitem(
        __import__("sys").modules, "pinecone", SimpleNamespace(Pinecone=_PcWithBrokenIndex)
    )

    import redis.asyncio as aioredis
    monkeypatch.setattr(aioredis, "from_url", lambda *a, **kw: _HealthyRedis())

    asyncio.run(_drive_lifespan_once())

    route = next(r for r in app.routes if getattr(r, "path", None) == "/health")
    response = asyncio.run(route.endpoint())
    assert response["status"] == "healthy"
    assert response["pinecone"] == "unavailable"
    assert response["redis"] == "connected"


def test_lifespan_does_not_propagate_redis_init_error(monkeypatch, caplog):
    """The 'Redis init failed' warning must be logged, not raised."""
    import redis.asyncio as aioredis

    monkeypatch.setattr(aioredis, "from_url", lambda *a, **kw: _BrokenRedis())

    with caplog.at_level(logging.WARNING, logger="app.main"):
        asyncio.run(_drive_lifespan_once())

    warnings = [r for r in caplog.records if "Redis init failed" in r.message]
    assert warnings, "expected a 'Redis init failed' warning to be logged"


def test_lifespan_does_not_propagate_pinecone_init_error(monkeypatch, caplog):
    """The 'Pinecone init failed' warning must be logged, not raised."""
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: _fake_settings(PINECONE_API_KEY="test-key"),
    )

    class _BoomPc:
        def __init__(self, api_key=None):
            pass
        def Index(self, name):
            raise RuntimeError("pinecone exploded")

    monkeypatch.setitem(
        __import__("sys").modules, "pinecone", SimpleNamespace(Pinecone=_BoomPc)
    )

    import redis.asyncio as aioredis
    monkeypatch.setattr(aioredis, "from_url", lambda *a, **kw: _HealthyRedis())

    with caplog.at_level(logging.WARNING, logger="app.main"):
        asyncio.run(_drive_lifespan_once())

    warnings = [r for r in caplog.records if "Pinecone init failed" in r.message]
    assert warnings, "expected a 'Pinecone init failed' warning to be logged"