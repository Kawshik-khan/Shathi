import asyncio

from fastapi import HTTPException

from app.core.dependencies import get_current_user_token


def test_missing_bearer_token_returns_401():
    try:
        asyncio.run(get_current_user_token(None))
    except HTTPException as exc:
        assert exc.status_code == 401
        assert exc.detail == "Not authenticated"
    else:
        raise AssertionError("Expected missing credentials to raise HTTPException")
