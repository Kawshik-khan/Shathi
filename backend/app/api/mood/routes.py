"""Mood tracking API routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.mood import MoodLog as MoodLogSchema, MoodLogCreate, MoodAnalytics
from app.services.mood import create_mood_log, get_mood_logs, get_mood_analytics
from app.models.user import User
from app.models.mood import MoodLog as MoodLogModel

router = APIRouter()


@router.post("/log", response_model=MoodLogSchema, status_code=status.HTTP_201_CREATED)
async def create_mood_log(
    log: MoodLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MoodLogSchema:
    """Create a new mood log entry."""
    try:
        mood_log = await create_mood_log(db, current_user.id, log)
        
        return MoodLogSchema(
            id=mood_log.id,
            user_id=mood_log.user_id,
            mood=mood_log.mood,
            stress=mood_log.stress,
            energy=mood_log.energy,
            sleep=mood_log.sleep,
            note=mood_log.note,
            emotion_detected=mood_log.emotion_detected,
            emotion_confidence=mood_log.emotion_confidence,
            ai_note=mood_log.ai_note,
            logged_at=mood_log.logged_at,
            created_at=mood_log.created_at,
            updated_at=mood_log.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create mood log"
        )


@router.get("/logs", response_model=List[MoodLogSchema])
async def get_mood_logs(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[MoodLogSchema]:
    """Get mood logs for the current user."""
    mood_logs = await get_mood_logs(db, current_user.id, limit, offset)
    
    return [
        MoodLogSchema(
            id=log.id,
            user_id=log.user_id,
            mood=log.mood,
            stress=log.stress,
            energy=log.energy,
            sleep=log.sleep,
            note=log.note,
            emotion_detected=log.emotion_detected,
            emotion_confidence=log.emotion_confidence,
            ai_note=log.ai_note,
            logged_at=log.logged_at,
            created_at=log.created_at,
            updated_at=log.updated_at,
        )
        for log in mood_logs
    ]


@router.get("/analytics", response_model=MoodAnalytics)
async def get_mood_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MoodAnalytics:
    """Get mood analytics and trends."""
    return await get_mood_analytics(db, current_user.id, days)

