"""FastAPI dependencies for authentication and authorization."""
import logging
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import raiseload

from app.core.database import get_db
from app.core.security import decode_token, TOKEN_VERSION_CLAIM
from app.models.user import User
from app.services.subscription import assert_feature_enabled

# HTTP Bearer token scheme. Keep auto_error disabled so our API returns the
# same 401 response shape for missing and invalid credentials.
security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


def get_pinecone_index(request: Request):
    """Return the startup-initialized Pinecone index, if available."""
    return getattr(request.app.state, "pinecone_index", None)


def get_redis(request: Request):
    """Return the startup-initialized Redis client, if available."""
    return getattr(request.app.state, "redis", None)


async def get_current_user_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:
    """Extract and validate JWT token from request."""
    if credentials is None:
        logger.info(
            "Authentication failed: missing bearer token path=%s origin=%s",
            request.url.path,
            request.headers.get("origin"),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload, error = decode_token(token)
    
    if error:
        logger.info(
            "Authentication failed: invalid bearer token path=%s origin=%s reason=%s",
            request.url.path,
            request.headers.get("origin"),
            error,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload.get("type") != "access":
        logger.info(
            "Authentication failed: invalid token type path=%s origin=%s token_type=%s",
            request.url.path,
            request.headers.get("origin"),
            payload.get("type"),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token


async def get_current_user(
    token: str = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token."""
    user = await _load_user_from_token(token, db)
    _enforce_token_version(user, decode_token(token)[0])
    return user


async def _load_user_from_token(token: str, db: AsyncSession) -> User:
    """Decode + DB lookup in one helper, so the tv check stays pure-testable."""
    payload, error = decode_token(token)

    if error or not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    result = await db.execute(
        select(User).options(raiseload("*")).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    return user


def _enforce_token_version(user: User, payload: dict | None) -> None:
    """Validate the ``tv`` claim against the user's current ``token_version``.

    P1 1.2: tokens carry a ``tv`` claim equal to ``user.token_version`` at
    issue time. Any credential change since then (password update, forced
    logout, account-takeover recovery) bumps the column, and tokens
    carrying an older ``tv`` are rejected. Raises 401 — not 403 —
    because the *credential* is no longer valid.

    Legacy tokens issued before this column existed may omit the claim;
    we treat ``None`` as ``0`` so a fresh re-login is required but
    existing accounts aren't silently logged out.

    Extracted as a module-level function so it can be unit-tested
    directly (no DB needed).
    """
    if not payload:
        return  # the *missing-payload* case is reported by the caller
    token_tv = payload.get(TOKEN_VERSION_CLAIM)
    expected_tv = int(getattr(user, "token_version", 0) or 0)
    if token_tv is None or int(token_tv) != expected_tv:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalidated — please sign in again",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user (additional check for active status)."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_system_role(required_role: str):
    """Return a dependency that requires a specific global system role."""

    async def dependency(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.system_role != required_role:
            logger.info(
                "Authorization failed: required_role=%s user_id=%s user_role=%s",
                required_role,
                current_user.id,
                current_user.system_role,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency


def require_feature(feature_key: str):
    """Return a dependency that requires a plan entitlement."""

    async def dependency(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        try:
            assert_feature_enabled(current_user, feature_key)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(exc),
            ) from exc
        return current_user

    return dependency


# Optional dependency that doesn't raise exception if no token
async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """Get current user if token is provided, otherwise return None."""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload, error = decode_token(token)
        
        if error or not payload:
            return None
        
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        result = await db.execute(
            select(User).options(raiseload("*")).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        return user if user and user.is_active else None
        
    except Exception:
        return None

