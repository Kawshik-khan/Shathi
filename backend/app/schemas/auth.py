"""Authentication schemas."""
from datetime import datetime
from typing import Optional

from pydantic import EmailStr, Field
from app.schemas.base import BaseSchema
from app.schemas.user import User


class Token(BaseSchema):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[User] = None


class TokenPayload(BaseSchema):
    """JWT token payload."""
    
    sub: Optional[str] = None  # User ID
    exp: Optional[int] = None
    type: Optional[str] = None


class LoginRequest(BaseSchema):
    """Login request schema."""
    
    email: EmailStr
    password: str


class RegisterRequest(BaseSchema):
    """Registration request schema."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    name: str = Field(..., min_length=1, max_length=100, description="User display name")


class RefreshTokenRequest(BaseSchema):
    """Refresh token request schema."""
    
    refresh_token: str

