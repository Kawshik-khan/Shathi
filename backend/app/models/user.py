"""User model."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Boolean, ForeignKey
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

