"""Schemas for Bangladesh localization features."""

from datetime import date, datetime
from typing import Optional

from app.schemas.base import BaseSchema


class LanguagePreferenceUpdate(BaseSchema):
    """User language preference update."""

    language: str


class TranslationResponse(BaseSchema):
    """Translation payload response."""

    language: str
    translations: dict


class LocalizedContentBase(BaseSchema):
    """Localized content fields."""

    content_type: str
    language: str = "en"
    title: str
    body: str
    region: Optional[str] = None
    published: bool = False


class LocalizedContentCreate(LocalizedContentBase):
    """Create localized content."""


class LocalizedContentUpdate(BaseSchema):
    """Update localized content."""

    content_type: Optional[str] = None
    language: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    region: Optional[str] = None
    published: Optional[bool] = None


class LocalizedContent(LocalizedContentBase):
    """Localized content response."""

    id: str
    created_at: datetime
    updated_at: datetime


class CrisisResourceBase(BaseSchema):
    """Crisis resource fields."""

    name: str
    phone: Optional[str] = None
    region: Optional[str] = None
    type: str
    language: str = "bn"
    is_24_7: bool = False


class CrisisResource(CrisisResourceBase):
    """Crisis resource response."""

    id: str
    created_at: Optional[datetime] = None


class FamilyCreate(BaseSchema):
    """Create a family account."""

    name: str


class FamilyInvite(BaseSchema):
    """Invite a family member."""

    email: str


class Family(BaseSchema):
    """Family response."""

    id: str
    name: str
    created_at: datetime


class FamilyMember(BaseSchema):
    """Family member response."""

    id: str
    name: str
    email: str
    language: str = "en"


class FamilyActivityCreate(BaseSchema):
    """Create a family activity."""

    activity_type: str
    title: str
    description: Optional[str] = None
    scheduled_date: Optional[date] = None


class FamilyActivity(FamilyActivityCreate):
    """Family activity response."""

    id: str
    family_id: str
    completed: bool = False
    created_at: datetime


class AcademicStressCreate(BaseSchema):
    """Academic stress log."""

    stress_level: int
    subject: Optional[str] = None
    notes: Optional[str] = None


class AcademicExamCreate(BaseSchema):
    """Academic exam entry."""

    exam_date: date
    subject: str
    notes: Optional[str] = None
    stress_level: Optional[int] = None


class AcademicEntry(BaseSchema):
    """Academic tracking response."""

    id: str
    user_id: str
    stress_level: Optional[int] = None
    exam_date: Optional[date] = None
    subject: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class Community(BaseSchema):
    """Community response."""

    id: str
    name: str
    region: Optional[str] = None
    language: str
    type: str
    created_at: datetime


class CommunityJoin(BaseSchema):
    """Community join request."""

    community_id: str


class CommunityPostCreate(BaseSchema):
    """Create a community post."""

    community_id: str
    content: str
    language: str = "bn"
    is_anonymous: bool = False


class CommunityPost(BaseSchema):
    """Community post response."""

    id: str
    user_id: Optional[str] = None
    community_id: str
    content: str
    language: str
    is_anonymous: bool
    created_at: datetime
