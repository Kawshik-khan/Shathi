"""Bangladesh crisis resource API routes."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.localization import CrisisResource as CrisisResourceModel
from app.schemas.localization import CrisisResource

router = APIRouter()

FALLBACK_RESOURCES = [
    CrisisResource(
        id="bd-emergency-999",
        name="National Emergency Service",
        phone="999",
        region="Bangladesh",
        type="hotline",
        language="bn",
        is_24_7=True,
        created_at=datetime.now(timezone.utc),
    ),
    CrisisResource(
        id="kaan-pete-roi",
        name="Kaan Pete Roi",
        phone=None,
        region="Bangladesh",
        type="ngo",
        language="bn",
        is_24_7=False,
        created_at=datetime.now(timezone.utc),
    ),
    CrisisResource(
        id="moner-bondhu",
        name="Moner Bondhu",
        phone=None,
        region="Bangladesh",
        type="counseling",
        language="bn",
        is_24_7=False,
        created_at=datetime.now(timezone.utc),
    ),
]


async def fetch_resources(
    db: AsyncSession,
    region: Optional[str] = None,
    language: Optional[str] = None,
) -> List[CrisisResourceModel | CrisisResource]:
    """Fetch database resources with static fallback."""
    query = select(CrisisResourceModel)
    if region:
        query = query.where(CrisisResourceModel.region == region)
    if language:
        query = query.where(CrisisResourceModel.language == language)

    result = await db.execute(query.order_by(CrisisResourceModel.name))
    resources = list(result.scalars().all())
    if resources:
        return resources

    return [
        resource
        for resource in FALLBACK_RESOURCES
        if (not region or resource.region == region)
        and (not language or resource.language == language)
    ]


@router.get("/resources", response_model=List[CrisisResource])
async def get_crisis_resources(
    region: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> List[CrisisResourceModel | CrisisResource]:
    """Get Bangladesh crisis resources."""
    return await fetch_resources(db, region=region, language=language)


@router.get("/resources/region/{region}", response_model=List[CrisisResource])
async def get_crisis_resources_by_region(
    region: str,
    language: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> List[CrisisResourceModel | CrisisResource]:
    """Get crisis resources by region."""
    return await fetch_resources(db, region=region, language=language)
