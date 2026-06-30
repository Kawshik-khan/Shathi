"""Gamification API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.gamification import GamificationSummary
from app.services.gamification import get_gamification_summary

router = APIRouter()


@router.get("/summary", response_model=GamificationSummary)
async def gamification_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> GamificationSummary:
    """Return XP, level, streak, and badges for the current user."""
    return await get_gamification_summary(db, current_user.id)
