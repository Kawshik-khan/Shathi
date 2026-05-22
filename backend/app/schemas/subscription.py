"""Subscription request schemas."""

from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class SubscriptionRequestCreate(BaseSchema):
    """Create a manual subscription upgrade request."""

    requested_plan: str = Field(..., min_length=1, max_length=30)
    message: Optional[str] = Field(default=None, max_length=1000)


class SubscriptionRequest(BaseSchema):
    """Manual subscription request response."""

    id: str
    user_id: str
    requested_plan: str
    status: str
    message: Optional[str] = None
    admin_note: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
