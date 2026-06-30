"""User model."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """User model for authentication and profile."""
    
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Monotonic token counter, bumped on every credential change
    # (password update, forced logout, etc). The current value is
    # embedded as the ``tv`` claim in every JWT issued for this user,
    # and ``dependencies.get_current_user`` rejects tokens whose ``tv``
    # is older than the column. This is the cheapest way to invalidate
    # outstanding sessions without maintaining a server-side token
    # blocklist — see P1 1.2 / OWASP A07.
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en")
    system_role: Mapped[str] = mapped_column(String(30), default="user", nullable=False)
    plan: Mapped[str] = mapped_column(String(30), default="free", nullable=False)
    subscription_status: Mapped[str] = mapped_column(
        String(30),
        default="active",
        nullable=False,
    )
    subscription_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    subscription_ends_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    billing_customer_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    family_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("families.id", ondelete="SET NULL"),
        nullable=True,
    )
    family_role: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    supabase_uid: Mapped[Optional[str]] = mapped_column(
        String(36),
        unique=True,
        index=True,
        nullable=True,
    )
    
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
    conversations = relationship("Conversation", back_populates="user", lazy="selectin")
    mood_logs = relationship("MoodLog", back_populates="user", lazy="selectin")
    mood_reflections = relationship(
        "MoodReflection",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    app_activity_events = relationship(
        "AppActivityEvent",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    sleep_timing_entries = relationship(
        "SleepTimingEntry",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    journals = relationship("Journal", back_populates="user", lazy="selectin")
    habits = relationship("Habit", back_populates="user", lazy="selectin")
    memories = relationship("Memory", back_populates="user", lazy="selectin")
    family = relationship("Family", back_populates="members", lazy="selectin")
    academic_entries = relationship("AcademicTracking", back_populates="user", lazy="selectin")
    community_posts = relationship(
        "CommunityPost",
        back_populates="user",
        lazy="selectin",
        foreign_keys="CommunityPost.user_id",
    )
    community_memberships = relationship("CommunityMember", back_populates="user", lazy="selectin")
    settings = relationship(
        "UserSettings",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
        uselist=False,
    )
    profile = relationship(
        "UserProfile",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
        uselist=False,
    )
    usage_events = relationship(
        "UsageEvent",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    chat_token_usage = relationship(
        "ChatTokenUsage",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    subscription_requests = relationship(
        "SubscriptionRequest",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
        foreign_keys="SubscriptionRequest.user_id",
    )

