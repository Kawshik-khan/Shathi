"""Authentication service."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    verify_password,
    get_password_hash,
    decode_token,
    create_access_token,
    create_refresh_token,
)
from app.models.user import User


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User | None:
    """Authenticate user with email and password."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
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
    # Check if user exists
    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    
    if existing:
        raise ValueError("User with this email already exists")
    
    # Create user
    user = User(
        email=email,
        name=name,
        hashed_password=get_password_hash(password),
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
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

    # Create new tokens
    new_access = create_access_token({"sub": user_id})
    new_refresh = create_refresh_token({"sub": user_id})

    return new_access, new_refresh, user

