"""Tests for production-fail-fast config validation."""
from __future__ import annotations

import pytest

from app.core import database
from app.core.config import Settings


def _make(**overrides) -> Settings:
    # Force `is_production=True` regardless of the host env, so each test
    # is hermetic and doesn't depend on the developer's APP_ENV.
    base = dict(
        APP_ENV="production",
        SECRET_KEY="x" * 32,
        CORS_ORIGINS="https://shathi.vercel.app",
        DATABASE_URL="postgresql://u:p@db.example/sathi",
    )
    base.update(overrides)
    return Settings(**base)


def test_validation_passes_for_healthy_config():
    settings = _make()
    # Should not raise.
    settings.validate_production()


def test_validation_skipped_when_not_production():
    settings = Settings(APP_ENV="development", SECRET_KEY="x" * 32)
    # Should not raise when a real secret is present and we are in dev.
    settings.validate_production()


def test_development_env_still_validates_secret_key():
    """SECRET_KEY must be checked in every environment (P1 1.4).

    A dev box that boots without the secret would otherwise sign tokens
    with ``""`` and let anyone forge admin sessions.
    """
    settings = Settings(APP_ENV="development", SECRET_KEY="")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        settings.validate_production()


def test_settings_rejects_missing_secret_at_construction_time():
    """P1 1.4 — an empty SECRET_KEY must be rejected by validate_production().

    Construction succeeds with an empty default (needed for test imports),
    but validate_production() must raise so a misconfigured deploy fails
    at startup rather than silently signing tokens with an empty secret.
    """
    settings = Settings(_env_file=None)
    # Force SECRET_KEY to empty regardless of any env var set in CI,
    # so this test is hermetic and proves the validation logic itself.
    settings.SECRET_KEY = ""
    with pytest.raises(Exception, match="SECRET_KEY"):
        settings.validate_production()


def test_validation_rejects_placeholder_dev_secret():
    """Dev `.env` historically shipped ``your-secret-key-here``; block it.

    Regression guard: anyone who puts the old dev placeholder back into
    .env (or tries to deploy with it) trips ``validate_production`` and
    breaks the deploy instead of silently signing tokens with a public
    value.
    """
    settings = _make(SECRET_KEY="your-secret-key-here")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        settings.validate_production()


def test_validation_rejects_short_secret():
    """Secrets shorter than 32 chars are rejected even in development.

    32 characters ≈ 16 bytes of entropy; anything shorter is brute-forceable
    with offline GPU clusters in hours, not years.
    """
    settings = _make(SECRET_KEY="short-but-not-placeholder")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        settings.validate_production()


def test_validation_accepts_long_random_secret():
    """A long random-looking secret must pass in any environment."""
    settings = _make(SECRET_KEY="a" * 64)
    # Should not raise.
    settings.validate_production()


@pytest.mark.parametrize(
    "bad_value",
    [
        "",  # empty
        "change-me-in-production",  # explicit placeholder
    ],
)
def test_validation_rejects_weak_secret_key(bad_value: str):
    settings = _make(SECRET_KEY=bad_value)
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        settings.validate_production()


@pytest.mark.parametrize(
    "bad_origin",
    [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.example.com",
        "http://localhost:3000,https://shathi.vercel.app",  # mixed
    ],
)
def test_validation_rejects_localhost_and_wildcard_origins(bad_origin: str):
    settings = _make(CORS_ORIGINS=bad_origin)
    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        settings.validate_production()


@pytest.mark.parametrize(
    "bad_origins",
    [
        "",  # empty string
        ",",  # only commas
        "   ",  # whitespace only
    ],
)
def test_validation_rejects_empty_cors_origins(bad_origins: str):
    """An empty origin list must fail in every environment (P1 1.6).

    FastAPI silently treats ``allow_origins=[]`` as no-CORS, which would
    block production entirely; surfacing the failure at startup gives
    the operator a clear pointer instead of a confusing 403 storm.
    """
    settings = _make(CORS_ORIGINS=bad_origins)
    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        settings.validate_production()


@pytest.mark.parametrize(
    "prod_origin",
    [
        "http://shathi.vercel.app",  # http in prod
        "http://localhost:3000",  # localhost over http in prod
    ],
)
def test_production_rejects_non_https_origins(prod_origin: str):
    """Production must pin https only (P1 1.6).

    Mixed-content CORS is the easiest way to exfil a credentialed
    session; require the operator to think about it explicitly.
    """
    settings = _make(CORS_ORIGINS=prod_origin)
    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        settings.validate_production()


def test_development_accepts_localhost_origins():
    """In dev we explicitly want localhost over http to work."""
    settings = _make(APP_ENV="development", CORS_ORIGINS="http://localhost:3000")
    # Should not raise.
    settings.validate_production()


def test_cors_allow_methods_default_is_explicit_list():
    """``['*']`` plus credentials is the classic CORS exfil pattern. Pin it."""
    settings = _make()
    methods = settings.cors_allow_methods_list
    assert "*" not in methods
    assert "OPTIONS" in methods
    assert "GET" in methods
    assert "POST" in methods


def test_cors_allow_headers_default_includes_authorization():
    settings = _make()
    headers = settings.cors_allow_headers_list
    assert "Authorization" in headers
    assert "*" not in headers


def test_cors_expose_headers_default_includes_request_id():
    settings = _make()
    expose = settings.cors_expose_headers_list
    assert "X-Request-ID" in expose
    assert "X-RateLimit-Remaining" in expose


def test_validation_rejects_missing_database_url():
    settings = _make(DATABASE_URL="", SUPABASE_DB_URL="")
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        settings.validate_production()


def test_database_url_uses_database_url_when_supabase_url_missing(monkeypatch):
    settings = Settings(
        APP_ENV="development",
        SECRET_KEY="x" * 32,
        SUPABASE_DB_URL="",
        SUPABASE_DB_HOST="",
        DATABASE_URL="postgresql://user:pass@db.example/sathi",
    )
    monkeypatch.setattr(database, "settings", settings)

    assert database.get_database_url() == "postgresql+asyncpg://user:pass@db.example/sathi"


def test_database_url_rejects_missing_database_configuration(monkeypatch):
    settings = Settings(
        APP_ENV="development",
        SECRET_KEY="x" * 32,
        SUPABASE_DB_URL="",
        SUPABASE_DB_HOST="",
        DATABASE_URL="",
    )
    monkeypatch.setattr(database, "settings", settings)
    monkeypatch.setattr(database, "get_supabase_db_url", lambda: None)

    with pytest.raises(RuntimeError, match="Database is not configured"):
        database.get_database_url()


def test_validation_lists_all_issues_at_once():
    # Two distinct problems — both should appear in the error message
    # so the operator can fix them in one pass instead of redeploying
    # repeatedly.
    settings = _make(
        SECRET_KEY="change-me-in-production",
        DATABASE_URL="",
        SUPABASE_DB_URL="",
        CORS_ORIGINS="http://localhost:3000",
    )
    with pytest.raises(RuntimeError) as exc_info:
        settings.validate_production()
    message = str(exc_info.value)
    assert "SECRET_KEY" in message
    assert "DATABASE_URL" in message
    assert "CORS_ORIGINS" in message