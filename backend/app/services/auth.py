"""Authentication service."""
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import raiseload

from app.core.config import get_settings
from app.core.security import (
    verify_password,
    get_password_hash,
    decode_token,
    issue_token_pair,
)
from app.models.user import User

settings = get_settings()


class DuplicateEmailError(ValueError):
    """Raised when a registration email already belongs to a user."""


def normalize_email(email: str) -> str:
    """Normalize email addresses before auth lookups."""
    return email.strip().lower()


def user_auth_query():
    """Return a user query that does not eager-load relationship graphs."""
    return select(User).options(raiseload("*"))


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User | None:
    """Authenticate user with email and password."""
    normalized_email = normalize_email(email)
    result = await db.execute(user_auth_query().where(User.email == normalized_email))
    user = result.scalar_one_or_none()
    
    if not user:
        return None

    if not user.hashed_password:
        return None

    if not verify_password(password, user.hashed_password):
        return None
    
    return user


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    name: str,
) -> User:
    """Create a new user."""
    normalized_email = normalize_email(email)

    # Check if user exists
    result = await db.execute(user_auth_query().where(User.email == normalized_email))
    existing = result.scalar_one_or_none()
    
    if existing:
        raise DuplicateEmailError("User with this email already exists")
    
    # Create user
    user = User(
        email=normalized_email,
        name=name,
        hashed_password=get_password_hash(password),
    )
    
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise DuplicateEmailError("User with this email already exists") from exc

    await db.refresh(user)
    
    return user


async def verify_google_id_token(id_token: str) -> dict[str, Any] | None:
    """Validate a Google ID token and return its tokeninfo payload."""
    if not settings.GOOGLE_CLIENT_ID:
        return None

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
            )
    except httpx.HTTPError:
        return None

    if response.status_code != 200:
        return None

    payload = response.json()
    email = payload.get("email")
    email_verified = payload.get("email_verified")

    if payload.get("aud") != settings.GOOGLE_CLIENT_ID:
        return None

    if not email or email_verified not in (True, "true", "True"):
        return None

    return payload


async def get_or_create_google_user(
    db: AsyncSession,
    google_payload: dict[str, Any],
) -> User:
    """Find or create a backend user from a verified Google profile."""
    email = str(google_payload["email"]).lower()
    google_sub = str(google_payload["sub"])
    name = str(google_payload.get("name") or email.split("@")[0])
    avatar_url = google_payload.get("picture")

    result = await db.execute(user_auth_query().where(User.supabase_uid == google_sub))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(user_auth_query().where(User.email == email))
        user = result.scalar_one_or_none()

    if user:
        user.supabase_uid = user.supabase_uid or google_sub
        user.avatar_url = user.avatar_url or avatar_url
        if not user.name:
            user.name = name
    else:
        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            hashed_password=None,
            supabase_uid=google_sub,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    return user


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """Get user by ID."""
    result = await db.execute(user_auth_query().where(User.id == user_id))
    return result.scalar_one_or_none()


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> tuple[str, str, User] | None:
    """Refresh access token using refresh token."""
    payload, error = decode_token(refresh_token)

    if error or not payload:
        return None

    if payload.get("type") != "refresh":
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = await get_user_by_id(db, user_id)
    if not user:
        return None

    # P1 1.2 — gate refresh on token-version match. Without this an
    # attacker who steals a long-lived refresh token can mint new
    # access tokens forever, even after the legitimate user changes
    # their password. We compare against the column (not against the
    # access token) because the *refresh* is what survives logout in
    # many browsers (HttpOnly + long max-age).
    from app.core.security import TOKEN_VERSION_CLAIM
    token_tv = payload.get(TOKEN_VERSION_CLAIM)
    expected_tv = int(getattr(user, "token_version", 0) or 0)
    if token_tv is None or int(token_tv) != expected_tv:
        return None

    # Create new tokens stamped with the current tv.
    new_access, new_refresh = issue_token_pair(user_id, expected_tv)

    return new_access, new_refresh, user

