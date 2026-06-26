"""Tests for production-fail-fast config validation."""
from __future__ import annotations

import pytest

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
    settings = Settings(APP_ENV="development")
    # Should not raise even though SECRET_KEY is the default placeholder.
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


def test_validation_rejects_missing_database_url():
    settings = _make(DATABASE_URL="", SUPABASE_DB_URL="")
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        settings.validate_production()


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