"""Mood tracking API routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_redis
from app.schemas.mood import (
    AppActivityEvent as AppActivityEventSchema,
    AppActivityEventCreate,
    MoodAnalytics,
    MoodInference,
    MoodLog as MoodLogSchema,
    MoodLogCreate,
    MoodReflection as MoodReflectionSchema,
    MoodReflectionCreate,
    SleepTiming as SleepTimingSchema,
    SleepTimingCreate,
)
from app.services.cache_service import invalidate_user_context
from app.services.chat.cache import invalidate_user_context_sections
from app.services.mood import (
    create_mood_log as create_mood_log_service,
    get_mood_logs as get_mood_logs_service,
    get_mood_analytics as get_mood_analytics_service,
)
from app.services.mood_inference import (
    create_activity_event as create_activity_event_service,
    create_mood_reflection as create_mood_reflection_service,
    create_sleep_timing as create_sleep_timing_service,
    infer_mood_from_signals,
)
from app.models.user import User
from app.models.mood import MoodLog as MoodLogModel

router = APIRouter()


def mood_log_response(log: MoodLogModel) -> MoodLogSchema:
    """Map a mood log model to the API schema."""
    return MoodLogSchema(
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
        updated_at=None,
    )


@router.post("/log", response_model=MoodLogSchema, status_code=status.HTTP_201_CREATED)
async def create_mood_log_endpoint(
    log: MoodLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> MoodLogSchema:
    """Create a new mood log entry."""
    try:
        mood_log = await create_mood_log_service(db, current_user.id, log)
        await invalidate_user_context(current_user.id, redis)
        await invalidate_user_context_sections(current_user.id, redis, ["mood", "inferred_mood"])
        return mood_log_response(mood_log)
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
async def get_mood_logs_endpoint(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[MoodLogSchema]:
    """Get mood logs for the current user."""
    mood_logs = await get_mood_logs_service(db, current_user.id, limit, offset)
    return [mood_log_response(log) for log in mood_logs]


@router.get("/analytics", response_model=MoodAnalytics)
async def get_mood_analytics_endpoint(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MoodAnalytics:
    """Get mood analytics and trends."""
    return await get_mood_analytics_service(db, current_user.id, days)


@router.post("/reflections", response_model=MoodReflectionSchema, status_code=status.HTTP_201_CREATED)
async def create_mood_reflection_endpoint(
    payload: MoodReflectionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> MoodReflectionSchema:
    """Create a natural-language mood reflection."""
    try:
        reflection = await create_mood_reflection_service(db, current_user.id, payload)
        await invalidate_user_context(current_user.id, redis)
        await invalidate_user_context_sections(current_user.id, redis, ["mood", "inferred_mood"])
        return MoodReflectionSchema.model_validate(reflection)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create mood reflection",
        )


@router.post("/activity", response_model=AppActivityEventSchema, status_code=status.HTTP_201_CREATED)
async def create_activity_event_endpoint(
    payload: AppActivityEventCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> AppActivityEventSchema:
    """Create a behavioral signal event for scoreless mood inference."""
    try:
        event = await create_activity_event_service(db, current_user.id, payload)
        await invalidate_user_context(current_user.id, redis)
        await invalidate_user_context_sections(current_user.id, redis, ["activity", "inferred_mood"])
        return AppActivityEventSchema.model_validate(event)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create activity event",
        )


@router.post("/sleep", response_model=SleepTimingSchema, status_code=status.HTTP_201_CREATED)
async def create_sleep_timing_endpoint(
    payload: SleepTimingCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> SleepTimingSchema:
    """Create a sleep timing signal for scoreless mood inference."""
    try:
        entry = await create_sleep_timing_service(db, current_user.id, payload)
        await invalidate_user_context(current_user.id, redis)
        await invalidate_user_context_sections(current_user.id, redis, ["sleep", "inferred_mood"])
        return SleepTimingSchema.model_validate(entry)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create sleep timing",
        )


@router.get("/inference", response_model=MoodInference)
async def get_mood_inference_endpoint(
    days: int = Query(14, ge=1, le=90),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MoodInference:
    """Infer mood from text, writing style, and behavioral signals."""
    return await infer_mood_from_signals(db, current_user.id, days)

