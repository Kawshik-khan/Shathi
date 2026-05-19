"""Community API routes."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.localization import (
    Community as CommunityModel,
    CommunityMember,
    CommunityPost as CommunityPostModel,
)
from app.models.user import User
from app.schemas.localization import Community, CommunityJoin, CommunityPost, CommunityPostCreate

router = APIRouter()

FALLBACK_COMMUNITIES = [
    Community(
        id="dhaka-wellness",
        name="Dhaka Wellness Circle",
        region="Dhaka",
        language="bn",
        type="regional",
        created_at=datetime.now(timezone.utc),
    ),
    Community(
        id="student-support-bd",
        name="Student Support Bangladesh",
        region="Bangladesh",
        language="bn",
        type="support_group",
        created_at=datetime.now(timezone.utc),
    ),
]


async def ensure_community(
    db: AsyncSession,
    community_id: str,
) -> CommunityModel:
    """Ensure fallback communities exist before writes."""
    result = await db.execute(select(CommunityModel).where(CommunityModel.id == community_id))
    community = result.scalar_one_or_none()
    if community:
        return community

    fallback = next((item for item in FALLBACK_COMMUNITIES if item.id == community_id), None)
    if not fallback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")

    community = CommunityModel(
        id=fallback.id,
        name=fallback.name,
        region=fallback.region,
        language=fallback.language,
        type=fallback.type,
    )
    db.add(community)
    await db.flush()
    return community


@router.get("", response_model=List[Community])
async def get_communities(
    region: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> List[CommunityModel | Community]:
    """Get available communities."""
    query = select(CommunityModel)
    if region:
        query = query.where(CommunityModel.region == region)
    if language:
        query = query.where(CommunityModel.language == language)
    result = await db.execute(query.order_by(CommunityModel.name))
    communities = list(result.scalars().all())
    if communities:
        return communities
    return [
        community
        for community in FALLBACK_COMMUNITIES
        if (not region or community.region == region)
        and (not language or community.language == language)
    ]


@router.post("/join")
async def join_community(
    request: CommunityJoin,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Join a community."""
    await ensure_community(db, request.community_id)
    existing = await db.execute(
        select(CommunityMember).where(
            CommunityMember.user_id == current_user.id,
            CommunityMember.community_id == request.community_id,
        )
    )
    if not existing.scalar_one_or_none():
        db.add(CommunityMember(user_id=current_user.id, community_id=request.community_id))
        await db.commit()

    return {"status": "joined", "community_id": request.community_id}


@router.post("/posts", response_model=CommunityPost, status_code=status.HTTP_201_CREATED)
async def create_community_post(
    request: CommunityPostCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> CommunityPostModel:
    """Create an anonymous-capable community post."""
    await ensure_community(db, request.community_id)
    post = CommunityPostModel(
        user_id=current_user.id,
        **request.model_dump(),
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


@router.get("/posts/{community_id}", response_model=List[CommunityPost])
async def get_community_posts(
    community_id: str,
    db: AsyncSession = Depends(get_db),
) -> List[CommunityPostModel]:
    """Get posts for a community."""
    result = await db.execute(
        select(CommunityPostModel)
        .where(CommunityPostModel.community_id == community_id)
        .order_by(CommunityPostModel.created_at.desc())
    )
    posts = list(result.scalars().all())
    for post in posts:
        if post.is_anonymous:
            post.user_id = None
    return posts
