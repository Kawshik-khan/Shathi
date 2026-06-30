import asyncio
from types import SimpleNamespace

from fastapi import HTTPException

from app.core.dependencies import get_current_user_token


def test_missing_bearer_token_returns_401():
    request = SimpleNamespace(
        url=SimpleNamespace(path="/api/v1/admin/overview"),
        headers={"origin": "http://localhost:3000"},
    )

    try:
        asyncio.run(get_current_user_token(request, None))
    except HTTPException as exc:
        assert exc.status_code == 401
        assert exc.detail == "Missing Authorization bearer token"
        assert exc.headers == {"WWW-Authenticate": "Bearer"}
    else:
        raise AssertionError("Expected missing credentials to raise HTTPException")
