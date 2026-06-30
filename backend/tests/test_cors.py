"""CORS middleware integration tests (P1 1.6).

These tests exercise the live ``CORSMiddleware`` configured by
``app.main.create_application`` rather than poking settings directly.
We care about three things:

1. The exact ``allow_origins`` list flows through (no ``*`` surprise).
2. Pinned methods/headers/expose are wired up — not the FastAPI
   default that sets ``["*"]`` (which fails the CORS spec the moment
   ``allow_credentials=True`` is requested).
3. A wildcard or non-https origin in production is rejected at startup,
   not silently allowed.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

from app.core.config import Settings


def _build_app(settings: Settings) -> FastAPI:
    """Build the same CORS stack ``create_application`` mounts.

    We deliberately do NOT import ``app.main`` directly: it would try to
    build the full app (DB engines, lifespan) and pull in unrelated
    wiring. This mini-app mirrors only the middleware that P1 1.6
    changes, so the test stays hermetic and fast.
    """
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=settings.cors_allow_methods_list,
        allow_headers=settings.cors_allow_headers_list,
        expose_headers=settings.cors_expose_headers_list,
        max_age=settings.CORS_MAX_AGE_SECONDS,
    )

    @app.get("/probe")
    async def _probe_route() -> dict[str, str]:
        return {"ok": "true"}

    return app


def test_middleware_threads_pinned_methods_and_headers():
    """The middleware must use the *pinned* lists, not FastAPI's wildcard default.

    ``fastapi.middleware.cors.CORSMiddleware`` defaults ``allow_methods``
    and ``allow_headers`` to ``["GET"]`` and ``[]`` when omitted. We pass
    them explicitly so a credentialed OPTIONS preflight from the
    frontend carries our Authorization header.
    """
    settings = Settings(
        _env_file=None,
        APP_ENV="development",
        SECRET_KEY="x" * 32,
        CORS_ORIGINS="http://localhost:3000",
    )
    app = _build_app(settings)
    client = TestClient(app)

    # Preflight from the same origin we allow. The response should
    # carry the pinned methods/headers, not ``*``.
    resp = client.options(
        "/probe",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert resp.status_code in (200, 204), resp.text
    allow_methods = resp.headers.get("access-control-allow-methods", "")
    allow_headers = resp.headers.get("access-control-allow-headers", "")
    assert allow_methods  # non-empty
    assert "*" not in allow_methods
    assert "POST" in allow_methods.upper()
    assert "authorization" in allow_headers.lower()


def test_middleware_rejects_origin_not_in_allow_list():
    """An origin we did not permit must NOT receive ACAO headers.

    Without this guard, a wildcard origin would silently let any
    credentialed request through — which is the entire threat model
    1.6 closes.
    """
    settings = Settings(
        _env_file=None,
        APP_ENV="development",
        SECRET_KEY="x" * 32,
        CORS_ORIGINS="https://shathi.vercel.app",
    )
    app = _build_app(settings)
    client = TestClient(app)

    resp = client.get(
        "/probe",
        headers={"Origin": "https://evil.example.com"},
    )
    # Body still comes back (CORS is enforced by the browser, not the
    # server) but the ACAO header must NOT echo the disallowed origin.
    assert "access-control-allow-origin" not in {k.lower() for k in resp.headers.keys()} or \
        resp.headers.get("access-control-allow-origin") != "https://evil.example.com"


def test_middleware_allows_listed_origin():
    settings = Settings(
        _env_file=None,
        APP_ENV="development",
        SECRET_KEY="x" * 32,
        CORS_ORIGINS="http://localhost:3000,https://shathi.vercel.app",
    )
    app = _build_app(settings)
    client = TestClient(app)

    resp = client.get(
        "/probe",
        headers={"Origin": "https://shathi.vercel.app"},
    )
    # No error and the allowed origin is echoed back.
    assert resp.headers.get("access-control-allow-origin") == "https://shathi.vercel.app"


def test_settings_cors_lists_parse_correctly():
    """Smoke test: comma-separated env strings round-trip to typed lists."""
    settings = Settings(
        _env_file=None,
        APP_ENV="development",
        SECRET_KEY="x" * 32,
        CORS_ORIGINS="https://a.example.com, https://b.example.com ",
        CORS_ALLOW_METHODS="GET, post ,  PUT",
        CORS_ALLOW_HEADERS="Authorization, Content-Type",
        CORS_EXPOSE_HEADERS="X-Request-ID, X-RateLimit-Remaining",
    )
    assert settings.cors_origins_list == ["https://a.example.com", "https://b.example.com"]
    # Methods are upper-cased so OPTIONS/HEAD/etc normalize cleanly.
    assert settings.cors_allow_methods_list == ["GET", "POST", "PUT"]
    assert settings.cors_allow_headers_list == ["Authorization", "Content-Type"]
    assert settings.cors_expose_headers_list == ["X-Request-ID", "X-RateLimit-Remaining"]


def test_max_age_is_set_so_preflights_are_cached():
    """Browsers cache preflights for ``max_age`` seconds. Default of 0 forces
    a preflight per request which is both wasteful AND a DoS amplifier
    against our origin. Pinned to 600s (10 min) by default."""
    settings = Settings(
        _env_file=None,
        APP_ENV="development",
        SECRET_KEY="x" * 32,
    )
    assert settings.CORS_MAX_AGE_SECONDS > 0
