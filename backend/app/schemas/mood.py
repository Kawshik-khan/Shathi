"""Mood tracking schemas."""
from datetime import date, datetime
from typing import Optional

from app.schemas.base import BaseSchema, TimestampedSchema


class MoodLogBase(BaseSchema):
    """Base mood log schema."""
    
    mood: int  # 1-10
    stress: Optional[int] = None  # 1-10
    energy: Optional[int] = None  # 1-10
    sleep: Optional[int] = None  # 1-10 (hours)
    note: Optional[str] = None


class MoodLogCreate(MoodLogBase):
    """Schema for creating a mood log."""
    
    logged_at: Optional[date] = None


class MoodLog(MoodLogBase, TimestampedSchema):
    """Full mood log schema."""
    
    id: str
    user_id: str
    emotion_detected: Optional[str] = None
    emotion_confidence: Optional[float] = None
    ai_note: Optional[str] = None
    logged_at: datetime


class DailyMood(BaseSchema):
    """Daily mood aggregation."""
    
    date: date
    avg_mood: float
    avg_stress: Optional[float] = None
    avg_energy: Optional[float] = None
    avg_sleep: Optional[float] = None
    entry_count: int


class MoodAnalytics(BaseSchema):
    """Mood analytics response."""
    
    current_streak: int
    avg_mood_7d: float
    avg_mood_30d: float
    trend_direction: str  # 'up', 'down', 'stable'
    emotion_distribution: dict[str, int]
    daily_data: list[DailyMood]

