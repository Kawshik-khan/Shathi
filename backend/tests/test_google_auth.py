import pytest

from app.services.auth import authenticate_user, verify_google_id_token


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
