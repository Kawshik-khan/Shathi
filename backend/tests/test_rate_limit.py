"""Tests for the Redis-backed sliding-window rate limiter.

We exercise both code paths:

* ``test_local_path`` — no Redis on ``app.state``, requests are counted
  in process memory and the limit is enforced.
* ``test_shared_redis_path`` — a fake Redis implementing the small slice
  of the API our Lua script uses (``register_script`` + ``zadd`` /
  ``zremrangebyscore`` / ``zcard`` / ``pexpire``) proves the middleware
  delegates to the shared bucket when one is available.

Both tests build a tiny FastAPI app that mounts ``RateLimitMiddleware``,
so we exercise the real ``dispatch`` rather than poking private fields.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.errors import RateLimitMiddleware


class _FakeRedis:
    """In-memory fake of the Redis API surface the rate limit script uses.

    Real ``redis.asyncio.Redis.register_script`` returns a callable; we
    mimic that contract so the middleware's
    ``redis.register_script(...)`` + ``await script(...)`` flow works
    without an actual server.
    """

    def __init__(self) -> None:
        self.zsets: dict[str, dict[str, float]] = defaultdict(dict)
        self.expires: dict[str, int] = {}

    def register_script(self, _source: str):
        async def _run(keys: list[str], args: list[Any]):
            key = keys[0]
            now = float(args[0])
            window = float(args[1])
            limit = int(args[2])
            member = str(args[3])

            bucket = self.zsets[key]
            cutoff = now - window
            stale = [m for m, score in bucket.items() if score < cutoff]
            for m in stale:
                bucket.pop(m, None)

            if len(bucket) >= limit:
                return 0
            bucket[member] = now
            self.expires[key] = int(window)
            return 1

        return _run


def _build_app(state_overrides: dict[str, Any] | None = None) -> FastAPI:
    """Create a minimal FastAPI app that mounts the rate-limit middleware.

    Endpoints are mounted under ``/api/v1/auth/...`` so the production
    prefix-match in ``RateLimitMiddleware.dispatch`` actually engages.
    ``state_overrides`` populates ``app.state`` before the middleware is
    added so we can simulate Redis presence/absence.
    """
    app = FastAPI()
    if state_overrides:
        for name, value in state_overrides.items():
            setattr(app.state, name, value)
    app.add_middleware(RateLimitMiddleware)

    @app.get("/api/v1/auth/limited")
    async def _limited() -> dict[str, str]:
        return {"ok": "yes"}

    @app.get("/api/v1/chat/limited")
    async def _chat_limited() -> dict[str, str]:
        return {"ok": "yes"}

    @app.get("/unlimited")
    async def _unlimited() -> dict[str, str]:
        return {"ok": "yes"}

    return app


@pytest.fixture(autouse=True)
def _shrink_rate_limit_window():
    """Pin window to 60 s and override per-route limits for predictable math."""
    settings = get_settings()
    saved_window = settings.RATE_LIMIT_WINDOW_SECONDS
    saved_auth = settings.AUTH_RATE_LIMIT_MAX
    saved_chat = settings.CHAT_RATE_LIMIT_MAX
    settings.RATE_LIMIT_WINDOW_SECONDS = 60
    settings.AUTH_RATE_LIMIT_MAX = 3
    settings.CHAT_RATE_LIMIT_MAX = 3
    try:
        yield
    finally:
        settings.RATE_LIMIT_WINDOW_SECONDS = saved_window
        settings.AUTH_RATE_LIMIT_MAX = saved_auth
        settings.CHAT_RATE_LIMIT_MAX = saved_chat


def test_local_path_enforces_limit():
    """No Redis on app.state -> requests are counted locally and capped."""
    app = _build_app()  # no redis attribute on state
    client = TestClient(app)

    for _ in range(3):
        assert client.get("/api/v1/auth/limited").status_code == 200

    blocked = client.get("/api/v1/auth/limited")
    assert blocked.status_code == 429
    body = blocked.json()
    assert body["error"]["code"] == "RATE_LIMITED"


def test_local_path_unrelated_path_is_unlimited():
    """Routes outside the auth/chat prefixes must not be limited."""
    app = _build_app()
    client = TestClient(app)

    for _ in range(20):
        assert client.get("/unlimited").status_code == 200


def test_shared_redis_path_enforces_limit():
    """With Redis attached, the middleware delegates to the shared bucket."""
    fake = _FakeRedis()
    app = _build_app(state_overrides={"redis": fake})
    client = TestClient(app)

    for _ in range(3):
        assert client.get("/api/v1/auth/limited").status_code == 200
    assert client.get("/api/v1/auth/limited").status_code == 429


def test_redis_failure_falls_back_to_local():
    """A Redis that throws on every call must not block the request."""

    class _BrokenRedis(_FakeRedis):
        def register_script(self, _source: str):
            async def _run(*_a, **_kw):
                raise ConnectionError("redis is down")

            return _run

    app = _build_app(state_overrides={"redis": _BrokenRedis()})
    client = TestClient(app)

    # Even with the limiter active, requests succeed because the
    # middleware logs and falls back to its in-process bucket.
    for _ in range(3):
        assert client.get("/api/v1/auth/limited").status_code == 200
    # After 3 successful local-bucket hits, the local window also trips.
    assert client.get("/api/v1/auth/limited").status_code == 429


def test_redis_keys_are_namespaced():
    """The shared bucket key should start with ``rl:`` so it's obvious in ``redis-cli``."""
    fake = _FakeRedis()
    app = _build_app(state_overrides={"redis": fake})
    client = TestClient(app)

    assert client.get("/api/v1/auth/limited").status_code == 200
    assert any(k.startswith("rl:") for k in fake.zsets.keys())


def test_redis_script_uses_unique_members():
    """Each request must record with a unique member so ZADD doesn't dedupe."""
    fake = _FakeRedis()
    app = _build_app(state_overrides={"redis": fake})
    client = TestClient(app)

    for _ in range(3):
        assert client.get("/api/v1/auth/limited").status_code == 200

    bucket_key = next(k for k in fake.zsets if k.startswith("rl:"))
    members = list(fake.zsets[bucket_key].keys())
    # All three requests must land as distinct set members; otherwise the
    # sliding window collapses to a single hit and the limit is bypassed.
    assert len(set(members)) == 3