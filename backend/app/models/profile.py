"""User profile model."""
import uuid
from datetime import date, datetime, timezone
from typing import Any, Optional

from sqlalchemy import Date, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserProfile(Base):
    """Extended profile and wellness preferences for a user."""

    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Dhaka")
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    wellness_goals: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    preferred_support_style: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="profile")
