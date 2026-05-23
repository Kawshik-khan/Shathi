"""Admin workspace schemas."""

from datetime import datetime
from typing import Any, Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class AdminUserSummary(BaseSchema):
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    is_active: bool
    system_role: str
    plan: str
    subscription_status: str
    subscription_started_at: Optional[datetime] = None
    subscription_ends_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class AdminUserUpdate(BaseSchema):
    is_active: Optional[bool] = None
    system_role: Optional[str] = None
    plan: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_ends_at: Optional[datetime] = None


class AdminSubscriptionRequestReview(BaseSchema):
    admin_note: Optional[str] = Field(default=None, max_length=1000)


class AdminSubscriptionRequest(BaseSchema):
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
    user: AdminUserSummary


class AdminAuditEvent(BaseSchema):
    id: str
    admin_user_id: Optional[str] = None
    action: str
    target_type: str
    target_id: str
    event_metadata: dict[str, Any]
    created_at: datetime


class AdminCommunityPost(BaseSchema):
    id: str
    user_id: str
    community_id: str
    content: str
    language: str
    is_anonymous: bool
    moderation_status: str = "visible"
    moderation_reason: Optional[str] = None
    hidden_at: Optional[datetime] = None
    hidden_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    community_name: Optional[str] = None


class AdminModerationAction(BaseSchema):
    reason: Optional[str] = Field(default=None, max_length=1000)


class AdminLocalizedContent(BaseSchema):
    id: str
    content_type: str
    language: str
    title: str
    body: str
    region: Optional[str] = None
    published: bool = False
    created_at: datetime
    updated_at: datetime


class AdminLocalizedContentPayload(BaseSchema):
    content_type: str = Field(..., min_length=1, max_length=50)
    language: str = Field(default="en", min_length=2, max_length=10)
    title: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    region: Optional[str] = Field(default=None, max_length=50)
    published: bool = False


class AdminLocalizedContentUpdate(BaseSchema):
    content_type: Optional[str] = Field(default=None, max_length=50)
    language: Optional[str] = Field(default=None, max_length=10)
    title: Optional[str] = None
    body: Optional[str] = None
    region: Optional[str] = Field(default=None, max_length=50)
    published: Optional[bool] = None


class AdminCrisisResource(BaseSchema):
    id: str
    name: str
    phone: Optional[str] = None
    region: Optional[str] = None
    type: str
    language: str
    is_24_7: bool = False
    description: Optional[str] = None
    url: Optional[str] = None
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AdminCrisisResourcePayload(BaseSchema):
    name: str = Field(..., min_length=1, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=30)
    region: Optional[str] = Field(default=None, max_length=50)
    type: str = Field(..., min_length=1, max_length=50)
    language: str = Field(default="bn", min_length=2, max_length=10)
    is_24_7: bool = False
    description: Optional[str] = None
    url: Optional[str] = Field(default=None, max_length=500)
    active: bool = True


class AdminCrisisResourceUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=30)
    region: Optional[str] = Field(default=None, max_length=50)
    type: Optional[str] = Field(default=None, max_length=50)
    language: Optional[str] = Field(default=None, max_length=10)
    is_24_7: Optional[bool] = None
    description: Optional[str] = None
    url: Optional[str] = Field(default=None, max_length=500)
    active: Optional[bool] = None


class AdminSafetyReview(BaseSchema):
    id: Optional[str] = None
    message_id: str
    user_id: str
    conversation_id: str
    excerpt: str
    language: Optional[str] = None
    emotion: Optional[str] = None
    crisis_severity: Optional[str] = None
    model_used: Optional[str] = None
    message_created_at: datetime
    status: str = "open"
    escalation_level: Optional[str] = None
    admin_note: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None


class AdminSafetyReviewPayload(BaseSchema):
    status: str = Field(..., min_length=1, max_length=30)
    escalation_level: Optional[str] = Field(default=None, max_length=30)
    admin_note: Optional[str] = Field(default=None, max_length=2000)


class AdminAnalyticsPoint(BaseSchema):
    date: str
    users: int = 0
    mood_logs: int = 0
    messages: int = 0
    crisis_messages: int = 0
    usage_events: int = 0


class AdminAnalytics(BaseSchema):
    range_days: int
    totals: dict[str, int | float]
    plan_counts: dict[str, int]
    subscription_request_counts: dict[str, int]
    safety_counts: dict[str, int]
    daily: list[AdminAnalyticsPoint]


class AdminTokenUsageTotals(BaseSchema):
    user_messages: int = 0
    assistant_messages: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_tokens: int = 0
    total_tokens: int = 0


class AdminUserTokenUsage(BaseSchema):
    user_id: str
    name: str
    email: str
    message_count: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cache_tokens: int = 0
    total_tokens: int = 0
    last_message_at: Optional[datetime] = None


class AdminMessageTokenUsage(BaseSchema):
    id: str
    user_id: str
    name: str
    email: str
    conversation_id: str
    user_message_id: Optional[str] = None
    assistant_message_id: Optional[str] = None
    model_used: Optional[str] = None
    input_tokens: int = 0
    output_tokens: int = 0
    cache_tokens: int = 0
    total_tokens: int = 0
    usage_source: str = "estimated"
    created_at: datetime


class AdminTokenUsage(BaseSchema):
    range_days: int
    totals: AdminTokenUsageTotals
    users: list[AdminUserTokenUsage]
    recent_messages: list[AdminMessageTokenUsage]


class AdminSystemHealth(BaseSchema):
    status: str
    service: str
    environment: str
    database: str
    redis: str
    pinecone: str
    audit_table: str
    safety_table: str


class AdminOverview(BaseSchema):
    total_users: int
    active_users: int
    pending_subscription_requests: int
    open_safety_reviews: int = 0
    crisis_messages: int = 0
    content_drafts: int = 0
    hidden_community_posts: int = 0
    plan_counts: dict[str, int]
    recent_users: list[AdminUserSummary]
    recent_audit_events: list[AdminAuditEvent]
