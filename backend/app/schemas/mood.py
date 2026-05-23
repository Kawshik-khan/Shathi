"""Mood tracking schemas."""
from datetime import date, datetime
from typing import Any, Literal, Optional

from pydantic import Field
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


class MoodReflectionCreate(BaseSchema):
    """Natural-language reflection check-in."""

    prompt: Optional[str] = Field(default=None, max_length=240)
    answer: str = Field(min_length=1, max_length=5000)


class MoodReflection(BaseSchema):
    """Stored natural-language reflection."""

    id: str
    user_id: str
    prompt: Optional[str] = None
    answer: str
    emotion_detected: Optional[str] = None
    emotion_confidence: Optional[float] = None
    created_at: datetime


class AppActivityEventCreate(BaseSchema):
    """Behavioral signal event."""

    event_type: str = Field(min_length=1, max_length=80)
    event_metadata: Optional[dict[str, Any]] = None
    occurred_at: Optional[datetime] = None


class AppActivityEvent(BaseSchema):
    """Stored behavioral signal event."""

    id: str
    user_id: str
    event_type: str
    event_metadata: Optional[dict[str, Any]] = None
    occurred_at: datetime
    created_at: datetime


class SleepTimingCreate(BaseSchema):
    """Sleep timing signal."""

    slept_at: datetime
    woke_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, ge=0, le=1440)
    quality_note: Optional[str] = Field(default=None, max_length=1000)


class SleepTiming(BaseSchema):
    """Stored sleep timing signal."""

    id: str
    user_id: str
    slept_at: datetime
    woke_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    quality_note: Optional[str] = None
    created_at: datetime


class MoodInferenceEvidence(BaseSchema):
    """Safe, user-facing inference evidence."""

    category: Literal["text", "writing_style", "behavior", "sleep", "routine"]
    state: str
    reason_bn: str
    reason_en: str
    weight: int


class MoodInference(BaseSchema):
    """Scoreless mood inference response."""

    state: str
    confidence: Literal["low", "medium", "high"]
    support_tone: str
    reason_bn: str
    reason_en: str
    evidence: list[MoodInferenceEvidence]
    source_counts: dict[str, int]
    days: int
    generated_at: datetime

