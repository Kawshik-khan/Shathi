"""Mood tracking service for database operations."""
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mood import MoodLog
from app.schemas.mood import MoodLogCreate, MoodAnalytics, DailyMood
from app.services.emotion import detect_emotion


async def create_mood_log(
    db: AsyncSession, 
    user_id: str, 
    mood_create: MoodLogCreate
) -> MoodLog:
    """Create a new mood log entry with AI analysis."""
    # Validate mood range
    if not 1 <= mood_create.mood <= 10:
        raise ValueError("Mood must be between 1 and 10")
    
    # Validate optional metrics
    for field_name, value in [
        ("stress", mood_create.stress),
        ("energy", mood_create.energy), 
        ("sleep", mood_create.sleep)
    ]:
        if value is not None and not 1 <= value <= 10:
            raise ValueError(f"{field_name.capitalize()} must be between 1 and 10")
    
    # Detect emotion from note if provided
    emotion_detected = None
    emotion_confidence = None
    ai_note = None
    
    if mood_create.note:
        try:
            emotion_result = await detect_emotion(mood_create.note)
            emotion_detected = emotion_result.emotion
            emotion_confidence = emotion_result.confidence
            ai_note = f"Detected emotion: {emotion_detected} (confidence: {emotion_confidence:.2f})"
        except Exception:
            # If emotion detection fails, continue without it
            pass
    
    # Create mood log
    mood_log = MoodLog(
        user_id=user_id,
        mood=mood_create.mood,
        stress=mood_create.stress,
        energy=mood_create.energy,
        sleep=mood_create.sleep,
        note=mood_create.note,
        emotion_detected=emotion_detected,
        emotion_confidence=emotion_confidence,
        ai_note=ai_note,
        logged_at=mood_create.logged_at or datetime.now(timezone.utc),
    )
    
    db.add(mood_log)
    await db.commit()
    await db.refresh(mood_log)
    
    return mood_log


async def get_mood_logs(
    db: AsyncSession, 
    user_id: str, 
    limit: int = 30,
    offset: int = 0
) -> List[MoodLog]:
    """Get mood logs for a user with pagination."""
    result = await db.execute(
        select(MoodLog)
        .where(MoodLog.user_id == user_id)
        .order_by(desc(MoodLog.logged_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_mood_analytics(
    db: AsyncSession, 
    user_id: str, 
    days: int = 30
) -> MoodAnalytics:
    """Get mood analytics and trends for a user."""
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get mood logs for the period
    result = await db.execute(
        select(MoodLog)
        .where(
            and_(
                MoodLog.user_id == user_id,
                MoodLog.logged_at >= start_date,
                MoodLog.logged_at <= end_date
            )
        )
        .order_by(MoodLog.logged_at)
    )
    mood_logs = result.scalars().all()
    
    if not mood_logs:
        return MoodAnalytics(
            current_streak=0,
            avg_mood_7d=0.0,
            avg_mood_30d=0.0,
            trend_direction="stable",
            emotion_distribution={},
            daily_data=[],
        )
    
    # Calculate averages
    all_moods = [log.mood for log in mood_logs]
    avg_mood_30d = sum(all_moods) / len(all_moods)
    
    # 7-day average
    seven_days_ago = end_date - timedelta(days=7)
    recent_moods = [log.mood for log in mood_logs if log.logged_at >= seven_days_ago]
    avg_mood_7d = sum(recent_moods) / len(recent_moods) if recent_moods else avg_mood_30d
    
    # Calculate trend
    if len(recent_moods) >= 2:
        recent_avg = sum(recent_moods[-7:]) / min(7, len(recent_moods))
        older_avg = sum(recent_moods[:-7]) / max(1, len(recent_moods) - 7)
        if recent_avg > older_avg + 0.5:
            trend_direction = "up"
        elif recent_avg < older_avg - 0.5:
            trend_direction = "down"
        else:
            trend_direction = "stable"
    else:
        trend_direction = "stable"
    
    # Calculate current streak (consecutive days with mood logs)
    current_streak = await calculate_mood_streak(db, user_id)
    
    # Emotion distribution
    emotion_counts = {}
    for log in mood_logs:
        if log.emotion_detected:
            emotion_counts[log.emotion_detected] = emotion_counts.get(log.emotion_detected, 0) + 1
    
    # Daily aggregation
    daily_data = await aggregate_daily_moods(db, user_id, days)
    
    return MoodAnalytics(
        current_streak=current_streak,
        avg_mood_7d=round(avg_mood_7d, 2),
        avg_mood_30d=round(avg_mood_30d, 2),
        trend_direction=trend_direction,
        emotion_distribution=emotion_counts,
        daily_data=daily_data,
    )


async def calculate_mood_streak(db: AsyncSession, user_id: str) -> int:
    """Calculate current streak of consecutive days with mood logs."""
    today = date.today()
    streak = 0
    
    # Check backwards from today
    for i in range(365):  # Check up to a year
        check_date = today - timedelta(days=i)
        
        # Check if there's a mood log for this date
        result = await db.execute(
            select(func.count(MoodLog.id))
            .where(
                and_(
                    MoodLog.user_id == user_id,
                    func.date(MoodLog.logged_at) == check_date
                )
            )
        )
        count = result.scalar()
        
        if count > 0:
            streak += 1
        else:
            # Break streak if we find a day without logs
            # unless we're checking today (might not have logged yet today)
            if i > 0:
                break
    
    return streak


async def aggregate_daily_moods(
    db: AsyncSession, 
    user_id: str, 
    days: int
) -> List[DailyMood]:
    """Aggregate mood data by day."""
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    result = await db.execute(
        select(
            func.date(MoodLog.logged_at).label('date'),
            func.avg(MoodLog.mood).label('avg_mood'),
            func.avg(MoodLog.stress).label('avg_stress'),
            func.avg(MoodLog.energy).label('avg_energy'),
            func.avg(MoodLog.sleep).label('avg_sleep'),
            func.count(MoodLog.id).label('entry_count')
        )
        .where(
            and_(
                MoodLog.user_id == user_id,
                func.date(MoodLog.logged_at) >= start_date,
                func.date(MoodLog.logged_at) <= end_date
            )
        )
        .group_by(func.date(MoodLog.logged_at))
        .order_by(func.date(MoodLog.logged_at))
    )
    
    daily_data = []
    for row in result:
        daily_data.append(DailyMood(
            date=row.date,
            avg_mood=round(float(row.avg_mood), 2),
            avg_stress=round(float(row.avg_stress), 2) if row.avg_stress else None,
            avg_energy=round(float(row.avg_energy), 2) if row.avg_energy else None,
            avg_sleep=round(float(row.avg_sleep), 2) if row.avg_sleep else None,
            entry_count=row.entry_count
        ))
    
    return daily_data


async def get_mood_log_by_id(
    db: AsyncSession, 
    user_id: str, 
    mood_log_id: str
) -> Optional[MoodLog]:
    """Get a specific mood log by ID."""
    result = await db.execute(
        select(MoodLog)
        .where(
            and_(
                MoodLog.id == mood_log_id,
                MoodLog.user_id == user_id
            )
        )
    )
    return result.scalar_one_or_none()


async def delete_mood_log(
    db: AsyncSession, 
    user_id: str, 
    mood_log_id: str
) -> bool:
    """Delete a mood log."""
    result = await db.execute(
        select(MoodLog)
        .where(
            and_(
                MoodLog.id == mood_log_id,
                MoodLog.user_id == user_id
            )
        )
    )
    mood_log = result.scalar_one_or_none()
    
    if mood_log:
        await db.delete(mood_log)
        await db.commit()
        return True
    
    return False

