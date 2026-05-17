"""Habit tracking models."""
import uuid
from datetime import datetime, timezone, date

from sqlalchemy import String, Integer, DateTime, ForeignKey, Date, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Habit(Base):
    """Habit definition model."""
    
    __tablename__ = "habits"
    
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
    
    # Habit details
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    
    # Frequency (e.g., "daily", "weekly", "weekdays")
    frequency: Mapped[str] = mapped_column(
        String(20),
        default="daily",
        nullable=False,
    )
    target_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )  # Times per frequency
    
    # Tracking
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    total_completions: Mapped[int] = mapped_column(Integer, default=0)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    # Relationships
    user = relationship("User", back_populates="habits")
    completions = relationship(
        "HabitCompletion",
        back_populates="habit",
        lazy="selectin",
        order_by="HabitCompletion.completed_at.desc()",
        cascade="all, delete-orphan",
    )


class HabitCompletion(Base):
    """Habit completion record."""
    
    __tablename__ = "habit_completions"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    habit_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Completion details
    completed_at: Mapped[date] = mapped_column(Date, nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=1)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # AI insight for this completion
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # Relationships
    habit = relationship("Habit", back_populates="completions")

