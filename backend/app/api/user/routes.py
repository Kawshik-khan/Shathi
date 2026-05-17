"""User API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.user import User, UserUpdate
from app.services.user import update_user
from app.models.user import User as UserModel

router = APIRouter()


@router.get("/me", response_model=User)
async def get_current_user(
    current_user: UserModel = Depends(get_current_active_user),
) -> User:
    """Get current user profile."""
    return User(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        supabase_uid=current_user.supabase_uid,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update current user profile."""
    updated_user = await update_user(db, current_user.id, user_update)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return User(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        avatar_url=updated_user.avatar_url,
        is_active=updated_user.is_active,
        supabase_uid=updated_user.supabase_uid,
        created_at=updated_user.created_at,
        updated_at=updated_user.updated_at,
    )

