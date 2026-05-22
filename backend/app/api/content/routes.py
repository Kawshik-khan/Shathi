"""Localized content API routes."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_system_role
from app.models.localization import LocalizedContent as LocalizedContentModel
from app.models.user import User
from app.schemas.localization import (
    LocalizedContent,
    LocalizedContentCreate,
    LocalizedContentUpdate,
)

router = APIRouter()
ADMIN_ONLY = require_system_role("admin")


@router.get("/localized", response_model=List[LocalizedContent])
async def get_localized_content(
    language: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None),
    include_unpublished: bool = Query(False),
    db: AsyncSession = Depends(get_db),
) -> List[LocalizedContentModel]:
    """Get localized content filtered by language, region, or type."""
    query = select(LocalizedContentModel)
    if language:
        query = query.where(LocalizedContentModel.language == language)
    if region:
        query = query.where(LocalizedContentModel.region == region)
    if content_type:
        query = query.where(LocalizedContentModel.content_type == content_type)
    if not include_unpublished:
        query = query.where(LocalizedContentModel.published == True)

    result = await db.execute(query.order_by(LocalizedContentModel.created_at.desc()))
    return list(result.scalars().all())


@router.post("/admin", response_model=LocalizedContent, status_code=status.HTTP_201_CREATED)
async def create_content(
    content: LocalizedContentCreate,
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> LocalizedContentModel:
    """Create localized content."""
    item = LocalizedContentModel(**content.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/admin/{content_id}", response_model=LocalizedContent)
async def update_content(
    content_id: str,
    content: LocalizedContentUpdate,
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> LocalizedContentModel:
    """Update localized content."""
    result = await db.execute(
        select(LocalizedContentModel).where(LocalizedContentModel.id == content_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    for key, value in content.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return item
