"""Academic stress and exam tracking routes."""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.localization import AcademicTracking
from app.models.user import User
from app.schemas.localization import AcademicEntry, AcademicExamCreate, AcademicStressCreate

router = APIRouter()


@router.post("/stress", response_model=AcademicEntry, status_code=status.HTTP_201_CREATED)
async def log_academic_stress(
    request: AcademicStressCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> AcademicTracking:
    """Log a student academic stress entry."""
    entry = AcademicTracking(
        user_id=current_user.id,
        stress_level=request.stress_level,
        subject=request.subject,
        notes=request.notes,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/stress", response_model=List[AcademicEntry])
async def get_stress_history(
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[AcademicTracking]:
    """Get current user's academic stress history."""
    result = await db.execute(
        select(AcademicTracking)
        .where(
            AcademicTracking.user_id == current_user.id,
            AcademicTracking.stress_level.isnot(None),
        )
        .order_by(AcademicTracking.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


@router.post("/exam", response_model=AcademicEntry, status_code=status.HTTP_201_CREATED)
async def add_exam_date(
    request: AcademicExamCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> AcademicTracking:
    """Add an upcoming exam date."""
    entry = AcademicTracking(
        user_id=current_user.id,
        stress_level=request.stress_level,
        exam_date=request.exam_date,
        subject=request.subject,
        notes=request.notes,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/exams", response_model=List[AcademicEntry])
async def get_upcoming_exams(
    from_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[AcademicTracking]:
    """Get current user's upcoming exams."""
    start_date = from_date or date.today()
    result = await db.execute(
        select(AcademicTracking)
        .where(
            AcademicTracking.user_id == current_user.id,
            AcademicTracking.exam_date.isnot(None),
            AcademicTracking.exam_date >= start_date,
        )
        .order_by(AcademicTracking.exam_date.asc())
    )
    return list(result.scalars().all())
