"""User schemas."""
from datetime import datetime

from typing import Optional
from pydantic import EmailStr

from app.schemas.base import BaseSchema, TimestampedSchema


class UserBase(BaseSchema):
    """Base user schema."""

    email: EmailStr
    name: str
    plan: str = 'free'
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user."""
    
    password: Optional[str] = None
    supabase_uid: Optional[str] = None


class UserUpdate(BaseSchema):
    """Schema for updating a user."""
    
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class User(UserBase, TimestampedSchema):
    """Full user schema for responses."""
    
    id: str
    is_active: bool
    supabase_uid: Optional[str] = None

