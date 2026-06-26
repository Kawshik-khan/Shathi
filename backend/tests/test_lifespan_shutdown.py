"""Drive the FastAPI lifespan generator to confirm ``close_embedding_clients``
is invoked on shutdown alongside the redis + engine cleanup.

We avoid pulling in ``asgi-lifespan`` by exercising the ``lifespan``
async-context-manager directly: enter it (skipping real Redis/Pinecone
init by pre-seeding ``app.state``), then exit, and assert that the
embedded HTTP client was closed.
"""
import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.main import app, lifespan
from app.services import memory


class _FakeRedis:
    def __init__(self):
        self.ping = AsyncMock(return_value=True)
        self.aclose = AsyncMock()


@pytest.fixture(autouse=True)
def _isolate(monkeypatch):
    """Skip real Redis/DB/Pinecone init during lifespan startup."""
    from app.core import config as config_module

    settings = config_module.get_settings()
    monkeypatch.setattr(settings, "AUTO_CREATE_TABLES", False, raising=False)
    monkeypatch.setattr(settings, "PINECONE_API_KEY", "", raising=False)
    yield


@pytest.mark.asyncio
async def test_lifespan_shutdown_closes_embedding_clients(monkeypatch):
    """``close_embedding_clients`` must run after redis/engine cleanup."""

    closed = {"called": False}

    async def fake_close():
        closed["called"] = True

    monkeypatch.setattr(memory, "close_embedding_clients", fake_close)

    # Patch the redis singleton lifespan builds, and engine.dispose.
    fake_redis = _FakeRedis()
    import redis.asyncio as aioredis

    monkeypatch.setattr(aioredis, "from_url", lambda *a, **kw: fake_redis)

    dispose = AsyncMock()
    monkeypatch.setattr("app.main.engine", SimpleNamespace(dispose=dispose))

    async with lifespan(app):
        # Inside the lifespan: redis has been assigned to app.state.
        assert app.state.redis is fake_redis
        # The helper should NOT have run yet — only on shutdown.
        assert closed["called"] is False

    # Shutdown has now run.
    assert closed["called"] is True, "close_embedding_clients was not called on shutdown"
    assert fake_redis.aclose.await_count == 1
    assert dispose.await_count == 1


def test_close_embedding_clients_is_idempotent():
    """Calling close when nothing is open should be a no-op (no raise)."""

    async def driver():
        prev = memory._HF_CLIENT
        memory._HF_CLIENT = None
        try:
            await memory.close_embedding_clients()
            assert memory._HF_CLIENT is None
        finally:
            memory._HF_CLIENT = prev

    asyncio.run(driver())