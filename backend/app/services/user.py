"""User service for database operations."""
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserUpdate


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """Get user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Get user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def update_user(
    db: AsyncSession, 
    user_id: str, 
    user_update: UserUpdate
) -> User | None:
    """Update user profile."""
    # Build update dict with only provided fields
    update_data = {}
    if user_update.name is not None:
        update_data["name"] = user_update.name
    if user_update.avatar_url is not None:
        update_data["avatar_url"] = user_update.avatar_url
    
    if not update_data:
        # No changes requested
        return await get_user_by_id(db, user_id)
    
    # Update user
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(**update_data)
        .returning(User)
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    return result.scalar_one_or_none()


async def deactivate_user(db: AsyncSession, user_id: str) -> bool:
    """Deactivate user account."""
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(is_active=False)
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    return result.rowcount > 0


async def activate_user(db: AsyncSession, user_id: str) -> bool:
    """Activate user account."""
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(is_active=True)
    )
    
    result = await db.execute(stmt)
    await db.commit()
    
    return result.rowcount > 0

