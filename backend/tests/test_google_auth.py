import pytest
from fastapi import HTTPException

from app.api.auth.routes import register
from app.schemas.auth import RegisterRequest
from app.services.auth import (
    DuplicateEmailError,
    authenticate_user,
    create_user,
    normalize_email,
    verify_google_id_token,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_verify_google_id_token_requires_client_id(monkeypatch):
    monkeypatch.setattr("app.services.auth.settings.GOOGLE_CLIENT_ID", None)

    assert await verify_google_id_token("token") is None


@pytest.mark.anyio
async def test_authenticate_user_rejects_passwordless_user():
    class Result:
        def scalar_one_or_none(self):
            return type("User", (), {"hashed_password": None})()

    class DB:
        async def execute(self, _statement):
            return Result()

    assert await authenticate_user(DB(), "google@example.com", "password") is None


def test_normalize_email_strips_and_lowercases():
    assert normalize_email("  USER@Example.COM  ") == "user@example.com"


@pytest.mark.anyio
async def test_create_user_rejects_existing_email_before_hashing():
    class Result:
        def scalar_one_or_none(self):
            return object()

    class DB:
        async def execute(self, _statement):
            return Result()

    with pytest.raises(DuplicateEmailError):
        await create_user(DB(), "existing@example.com", "password123", "Existing User")


@pytest.mark.anyio
async def test_register_duplicate_email_returns_409(monkeypatch):
    async def duplicate_user(*_args, **_kwargs):
        raise DuplicateEmailError("User with this email already exists")

    monkeypatch.setattr("app.api.auth.routes.create_user", duplicate_user)

    with pytest.raises(HTTPException) as exc_info:
        await register(
            RegisterRequest(
                email="existing@example.com",
                password="password123",
                name="Existing User",
            ),
            db=object(),
        )

    assert exc_info.value.status_code == 409
