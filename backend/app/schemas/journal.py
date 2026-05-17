"""Journal schemas."""
from datetime import datetime
from typing import Optional, List

from app.schemas.base import BaseSchema, TimestampedSchema


class JournalBase(BaseSchema):
    """Base journal schema."""
    
    title: Optional[str] = None
    content: str


class JournalCreate(JournalBase):
    """Schema for creating a journal entry."""
    
    written_at: Optional[datetime] = None


class JournalUpdate(BaseSchema):
    """Schema for updating a journal entry."""
    
    title: Optional[str] = None
    content: Optional[str] = None


class Journal(JournalBase, TimestampedSchema):
    """Full journal schema."""
    
    id: str
    user_id: str
    emotion_summary: Optional[str] = None
    emotion_tags: List[str] = []
    sentiment_score: Optional[float] = None
    ai_insights: Optional[str] = None
    word_count: Optional[int] = None
    reading_time_minutes: Optional[int] = None
    written_at: datetime

