"""Family account API routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.localization import Family as FamilyModel, FamilyActivity as FamilyActivityModel
from app.models.user import User
from app.schemas.localization import (
    Family,
    FamilyActivity,
    FamilyActivityCreate,
    FamilyCreate,
    FamilyInvite,
    FamilyMember,
)

router = APIRouter()


@router.post("/create", response_model=Family, status_code=status.HTTP_201_CREATED)
async def create_family_account(
    request: FamilyCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> FamilyModel:
    """Create a family account and attach the current user."""
    family = FamilyModel(name=request.name)
    db.add(family)
    await db.flush()
    current_user.family_id = family.id
    await db.commit()
    await db.refresh(family)
    return family


@router.post("/invite")
async def invite_family_member(
    request: FamilyInvite,
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Create a family invitation placeholder."""
    if not current_user.family_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Create a family first")
    return {
        "status": "pending",
        "email": request.email,
        "family_id": current_user.family_id,
    }


@router.get("/members", response_model=List[FamilyMember])
async def get_family_members(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[User]:
    """Get current user's family members."""
    if not current_user.family_id:
        return []
    result = await db.execute(select(User).where(User.family_id == current_user.family_id))
    return list(result.scalars().all())


@router.get("/analytics")
async def get_family_analytics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get basic family wellness analytics."""
    if not current_user.family_id:
        return {"family_id": None, "member_count": 0, "activity_count": 0, "completed_activities": 0}

    member_count = await db.scalar(
        select(func.count(User.id)).where(User.family_id == current_user.family_id)
    )
    activity_count = await db.scalar(
        select(func.count(FamilyActivityModel.id)).where(FamilyActivityModel.family_id == current_user.family_id)
    )
    completed_count = await db.scalar(
        select(func.count(FamilyActivityModel.id)).where(
            FamilyActivityModel.family_id == current_user.family_id,
            FamilyActivityModel.completed == True,
        )
    )

    return {
        "family_id": current_user.family_id,
        "member_count": member_count or 0,
        "activity_count": activity_count or 0,
        "completed_activities": completed_count or 0,
    }


@router.post("/activities", response_model=FamilyActivity, status_code=status.HTTP_201_CREATED)
async def create_family_activity(
    request: FamilyActivityCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> FamilyActivityModel:
    """Create a family wellness activity."""
    if not current_user.family_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Create a family first")

    activity = FamilyActivityModel(
        family_id=current_user.family_id,
        **request.model_dump(),
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity
