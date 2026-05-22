"""Manual subscription request API routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.subscription import SubscriptionRequest as SubscriptionRequestModel
from app.models.user import User
from app.schemas.subscription import SubscriptionRequest, SubscriptionRequestCreate
from app.services.subscription import get_effective_plan

router = APIRouter()

REQUESTABLE_PLANS = {"premium", "family"}
OPEN_REQUEST_STATUS = "pending"


@router.post("", response_model=SubscriptionRequest, status_code=status.HTTP_201_CREATED)
async def create_subscription_request(
    payload: SubscriptionRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionRequestModel:
    """Create a manual upgrade request for the current user."""
    requested_plan = payload.requested_plan.strip().lower()
    if requested_plan not in REQUESTABLE_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested plan must be premium or family",
        )

    if get_effective_plan(current_user) == requested_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have this plan",
        )

    existing = await db.execute(
        select(SubscriptionRequestModel).where(
            SubscriptionRequestModel.user_id == current_user.id,
            SubscriptionRequestModel.status == OPEN_REQUEST_STATUS,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending subscription request",
        )

    request = SubscriptionRequestModel(
        user_id=current_user.id,
        requested_plan=requested_plan,
        message=payload.message.strip() if payload.message else None,
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request


@router.get("/me", response_model=List[SubscriptionRequest])
async def list_my_subscription_requests(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[SubscriptionRequestModel]:
    """List the current user's manual subscription requests."""
    result = await db.execute(
        select(SubscriptionRequestModel)
        .where(SubscriptionRequestModel.user_id == current_user.id)
        .order_by(SubscriptionRequestModel.created_at.desc())
    )
    return list(result.scalars().all())
