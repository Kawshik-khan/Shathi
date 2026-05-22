"""User schemas."""
from datetime import date, datetime

from typing import Any, Optional
from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema, TimestampedSchema


class UserBase(BaseSchema):
    """Base user schema."""

    email: EmailStr
    name: str
    system_role: str = "user"
    plan: str = "free"
    subscription_status: str = "active"
    avatar_url: Optional[str] = None
    language: str = 'en'


class UserCreate(UserBase):
    """Schema for creating a user."""
    
    password: Optional[str] = None
    supabase_uid: Optional[str] = None


class UserUpdate(BaseSchema):
    """Schema for updating a user."""
    
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None


class User(UserBase, TimestampedSchema):
    """Full user schema for responses."""
    
    id: str
    is_active: bool
    family_id: Optional[str] = None
    family_role: Optional[str] = None
    supabase_uid: Optional[str] = None
    subscription_started_at: Optional[datetime] = None
    subscription_ends_at: Optional[datetime] = None


class UserProfileUpdate(BaseSchema):
    """Profile update request."""

    name: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None
    bio: Optional[str] = None
    timezone: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    wellness_goals: Optional[dict[str, Any]] = None
    preferred_support_style: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class UserProfile(BaseSchema):
    """Full profile response with user basics and wellness profile."""

    id: str
    user_id: str
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    language: str = "en"
    bio: Optional[str] = None
    timezone: str = "Asia/Dhaka"
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    wellness_goals: dict[str, Any] = Field(default_factory=dict)
    preferred_support_style: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserSettingsPayload(BaseSchema):
    """Persisted settings payload."""

    settings: dict[str, Any]


class UserSettings(UserSettingsPayload, TimestampedSchema):
    """Full user settings response."""

    id: str
    user_id: str


class PasswordUpdate(BaseSchema):
    """Password update request."""

    current_password: str
    new_password: str


class AccountDeleteRequest(BaseSchema):
    """Account deletion request."""

    confirmation: str
    password: Optional[str] = None


class SessionInfo(BaseSchema):
    """Current session metadata."""

    id: str
    current: bool = True
    auth_model: str = "custom_jwt"
    note: str


class SubscriptionSummary(BaseSchema):
    """Current plan, limits, and usage for the authenticated user."""

    plan: str
    effective_plan: str
    subscription_status: str
    system_role: str
    subscription_started_at: Optional[datetime] = None
    subscription_ends_at: Optional[datetime] = None
    limits: dict[str, Any]
    usage: dict[str, int]
    entitlements: dict[str, bool]

