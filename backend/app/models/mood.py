"""Mood tracking models."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MoodLog(Base):
    """Daily mood log model."""
    
    __tablename__ = "mood_logs"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Mood metrics (1-10 scale)
    mood: Mapped[int] = mapped_column(Integer, nullable=False)
    stress: Mapped[int | None] = mapped_column(Integer, nullable=True)
    energy: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sleep: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # AI analysis
    emotion_detected: Mapped[str | None] = mapped_column(String(50), nullable=True)
    emotion_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # User note
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamp (user can log for past dates)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # Relationships
    user = relationship("User", back_populates="mood_logs")

