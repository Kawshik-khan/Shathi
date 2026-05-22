"""Admin workspace API routes."""

from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, raiseload

from app.core.config import get_settings
from app.core.database import get_db
from app.core.dependencies import require_system_role
from app.models.admin import AdminAuditEvent as AdminAuditEventModel
from app.models.admin import SafetyReview as SafetyReviewModel
from app.models.conversation import Conversation, Message
from app.models.habit import Habit
from app.models.journal import Journal
from app.models.localization import (
    Community,
    CommunityPost,
    CrisisResource as CrisisResourceModel,
    LocalizedContent as LocalizedContentModel,
)
from app.models.mood import MoodLog
from app.models.subscription import (
    SubscriptionRequest as SubscriptionRequestModel,
    UsageEvent,
)
from app.models.user import User
from app.schemas.admin import (
    AdminAnalytics,
    AdminAnalyticsPoint,
    AdminAuditEvent,
    AdminCommunityPost,
    AdminCrisisResource,
    AdminCrisisResourcePayload,
    AdminCrisisResourceUpdate,
    AdminLocalizedContent,
    AdminLocalizedContentPayload,
    AdminLocalizedContentUpdate,
    AdminModerationAction,
    AdminOverview,
    AdminSafetyReview,
    AdminSafetyReviewPayload,
    AdminSubscriptionRequest,
    AdminSubscriptionRequestReview,
    AdminSystemHealth,
    AdminUserSummary,
    AdminUserUpdate,
)

router = APIRouter()

ADMIN_ONLY = require_system_role("admin")
VALID_PLANS = {"free", "premium", "family"}
VALID_SUBSCRIPTION_STATUSES = {"active", "trialing", "past_due", "canceled"}
VALID_SYSTEM_ROLES = {"user", "admin"}
VALID_REQUEST_STATUSES = {"pending", "approved", "rejected", "canceled"}
VALID_SAFETY_STATUSES = {"open", "reviewed", "escalated", "dismissed"}


def user_summary(user: User) -> AdminUserSummary:
    return AdminUserSummary(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        system_role=user.system_role,
        plan=user.plan,
        subscription_status=user.subscription_status,
        subscription_started_at=user.subscription_started_at,
        subscription_ends_at=user.subscription_ends_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def audit_response(event: AdminAuditEventModel) -> AdminAuditEvent:
    return AdminAuditEvent(
        id=event.id,
        admin_user_id=event.admin_user_id,
        action=event.action,
        target_type=event.target_type,
        target_id=event.target_id,
        event_metadata=event.event_metadata or {},
        created_at=event.created_at,
    )


def request_response(request: SubscriptionRequestModel) -> AdminSubscriptionRequest:
    return AdminSubscriptionRequest(
        id=request.id,
        user_id=request.user_id,
        requested_plan=request.requested_plan,
        status=request.status,
        message=request.message,
        admin_note=request.admin_note,
        reviewed_by=request.reviewed_by,
        reviewed_at=request.reviewed_at,
        created_at=request.created_at,
        updated_at=request.updated_at,
        user=user_summary(request.user),
    )


def content_response(item: LocalizedContentModel) -> AdminLocalizedContent:
    return AdminLocalizedContent(
        id=item.id,
        content_type=item.content_type,
        language=item.language,
        title=item.title,
        body=item.body,
        region=item.region,
        published=item.published,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def crisis_resource_response(resource: CrisisResourceModel) -> AdminCrisisResource:
    return AdminCrisisResource(
        id=resource.id,
        name=resource.name,
        phone=resource.phone,
        region=resource.region,
        type=resource.type,
        language=resource.language,
        is_24_7=resource.is_24_7,
        description=resource.description,
        url=resource.url,
        active=resource.active,
        created_at=resource.created_at,
        updated_at=resource.updated_at,
    )


def community_post_response(
    post: CommunityPost,
    author_name: str,
    author_email: str,
    community_name: str,
) -> AdminCommunityPost:
    return AdminCommunityPost(
        id=post.id,
        user_id=post.user_id,
        community_id=post.community_id,
        content=post.content,
        language=post.language,
        is_anonymous=post.is_anonymous,
        moderation_status=post.moderation_status,
        moderation_reason=post.moderation_reason,
        hidden_at=post.hidden_at,
        hidden_by=post.hidden_by,
        reviewed_at=post.reviewed_at,
        created_at=post.created_at,
        author_name="Anonymous" if post.is_anonymous else author_name,
        author_email=None if post.is_anonymous else author_email,
        community_name=community_name,
    )


def safety_review_response(
    message: Message,
    conversation: Conversation,
    review: SafetyReviewModel | None,
) -> AdminSafetyReview:
    excerpt = message.content.strip().replace("\n", " ")
    if len(excerpt) > 240:
        excerpt = f"{excerpt[:237]}..."

    return AdminSafetyReview(
        id=review.id if review else None,
        message_id=message.id,
        user_id=conversation.user_id,
        conversation_id=conversation.id,
        excerpt=excerpt,
        language=conversation.language,
        emotion=message.emotion,
        crisis_severity=message.crisis_severity,
        model_used=message.model_used,
        message_created_at=message.created_at,
        status=review.status if review else "open",
        escalation_level=review.escalation_level if review else None,
        admin_note=review.admin_note if review else None,
        reviewed_by=review.reviewed_by if review else None,
        reviewed_at=review.reviewed_at if review else None,
    )


async def log_admin_event(
    db: AsyncSession,
    *,
    admin_user: User,
    action: str,
    target_type: str,
    target_id: str,
    metadata: dict[str, Any] | None = None,
) -> AdminAuditEventModel:
    event = AdminAuditEventModel(
        admin_user_id=admin_user.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        event_metadata=jsonable_encoder(metadata or {}),
    )
    db.add(event)
    return event


@router.get("/overview", response_model=AdminOverview)
async def get_admin_overview(
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminOverview:
    total_users = await db.scalar(select(func.count(User.id)))
    active_users = await db.scalar(select(func.count(User.id)).where(User.is_active.is_(True)))
    pending_requests = await db.scalar(
        select(func.count(SubscriptionRequestModel.id)).where(
            SubscriptionRequestModel.status == "pending"
        )
    )
    crisis_messages = await db.scalar(select(func.count(Message.id)).where(Message.crisis_flag.is_(True)))
    open_safety_reviews = await db.scalar(
        select(func.count(Message.id))
        .join(Conversation, Conversation.id == Message.conversation_id)
        .outerjoin(SafetyReviewModel, SafetyReviewModel.message_id == Message.id)
        .where(Message.crisis_flag.is_(True))
        .where(
            (SafetyReviewModel.id.is_(None))
            | (SafetyReviewModel.status.in_(["open", "escalated"]))
        )
    )
    content_drafts = await db.scalar(
        select(func.count(LocalizedContentModel.id)).where(LocalizedContentModel.published.is_(False))
    )
    hidden_posts = await db.scalar(
        select(func.count(CommunityPost.id)).where(CommunityPost.moderation_status == "hidden")
    )

    plan_rows = await db.execute(select(User.plan, func.count(User.id)).group_by(User.plan))
    plan_counts = {plan: count for plan, count in plan_rows.all()}

    recent_user_rows = await db.execute(
        select(User).options(raiseload("*")).order_by(User.created_at.desc()).limit(5)
    )
    recent_audit_rows = await db.execute(
        select(AdminAuditEventModel).order_by(AdminAuditEventModel.created_at.desc()).limit(8)
    )

    return AdminOverview(
        total_users=total_users or 0,
        active_users=active_users or 0,
        pending_subscription_requests=pending_requests or 0,
        open_safety_reviews=open_safety_reviews or 0,
        crisis_messages=crisis_messages or 0,
        content_drafts=content_drafts or 0,
        hidden_community_posts=hidden_posts or 0,
        plan_counts=plan_counts,
        recent_users=[user_summary(user) for user in recent_user_rows.scalars().all()],
        recent_audit_events=[audit_response(event) for event in recent_audit_rows.scalars().all()],
    )


@router.get("/users", response_model=list[AdminUserSummary])
async def list_admin_users(
    query: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    subscription_status: Optional[str] = Query(None),
    system_role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> list[AdminUserSummary]:
    statement = select(User).options(raiseload("*"))

    if query:
        search = f"%{query.strip()}%"
        statement = statement.where(User.email.ilike(search) | User.name.ilike(search))
    if plan:
        statement = statement.where(User.plan == plan)
    if subscription_status:
        statement = statement.where(User.subscription_status == subscription_status)
    if system_role:
        statement = statement.where(User.system_role == system_role)
    if is_active is not None:
        statement = statement.where(User.is_active == is_active)

    rows = await db.execute(statement.order_by(User.created_at.desc()).offset(offset).limit(limit))
    return [user_summary(user) for user in rows.scalars().all()]


@router.patch("/users/{user_id}", response_model=AdminUserSummary)
async def update_admin_user(
    user_id: str,
    payload: AdminUserUpdate,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminUserSummary:
    result = await db.execute(select(User).options(raiseload("*")).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return user_summary(user)

    if "plan" in changes and changes["plan"] not in VALID_PLANS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan")
    if "subscription_status" in changes and changes["subscription_status"] not in VALID_SUBSCRIPTION_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid subscription status")
    if "system_role" in changes and changes["system_role"] not in VALID_SYSTEM_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid system role")
    if user.id == admin_user.id and changes.get("system_role") == "user":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot remove their own admin role")
    if user.id == admin_user.id and changes.get("is_active") is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot deactivate their own account")

    before = {key: getattr(user, key) for key in changes}
    for key, value in changes.items():
        setattr(user, key, value)

    await log_admin_event(
        db,
        admin_user=admin_user,
        action="user.updated",
        target_type="user",
        target_id=user.id,
        metadata={"before": before, "after": changes},
    )
    await db.commit()
    await db.refresh(user)
    return user_summary(user)


@router.get("/subscription-requests", response_model=list[AdminSubscriptionRequest])
async def list_admin_subscription_requests(
    request_status: Optional[str] = Query(None, alias="status"),
    requested_plan: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> list[AdminSubscriptionRequest]:
    statement = select(SubscriptionRequestModel).options(joinedload(SubscriptionRequestModel.user).raiseload("*"))
    if request_status:
        if request_status not in VALID_REQUEST_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request status")
        statement = statement.where(SubscriptionRequestModel.status == request_status)
    if requested_plan:
        if requested_plan not in VALID_PLANS - {"free"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan")
        statement = statement.where(SubscriptionRequestModel.requested_plan == requested_plan)

    rows = await db.execute(
        statement.order_by(SubscriptionRequestModel.created_at.desc()).offset(offset).limit(limit)
    )
    return [request_response(request) for request in rows.scalars().all()]


@router.post("/subscription-requests/{request_id}/approve", response_model=AdminSubscriptionRequest)
async def approve_admin_subscription_request(
    request_id: str,
    payload: AdminSubscriptionRequestReview,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminSubscriptionRequest:
    request = await get_pending_subscription_request(db, request_id)
    now = datetime.now(timezone.utc)

    request.status = "approved"
    request.admin_note = payload.admin_note.strip() if payload.admin_note else None
    request.reviewed_by = admin_user.id
    request.reviewed_at = now
    request.user.plan = request.requested_plan
    request.user.subscription_status = "active"
    request.user.subscription_started_at = now

    await log_admin_event(
        db,
        admin_user=admin_user,
        action="subscription_request.approved",
        target_type="subscription_request",
        target_id=request.id,
        metadata={"user_id": request.user_id, "plan": request.requested_plan},
    )
    await db.commit()
    return request_response(request)


@router.post("/subscription-requests/{request_id}/reject", response_model=AdminSubscriptionRequest)
async def reject_admin_subscription_request(
    request_id: str,
    payload: AdminSubscriptionRequestReview,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminSubscriptionRequest:
    request = await get_pending_subscription_request(db, request_id)

    request.status = "rejected"
    request.admin_note = payload.admin_note.strip() if payload.admin_note else None
    request.reviewed_by = admin_user.id
    request.reviewed_at = datetime.now(timezone.utc)

    await log_admin_event(
        db,
        admin_user=admin_user,
        action="subscription_request.rejected",
        target_type="subscription_request",
        target_id=request.id,
        metadata={"user_id": request.user_id, "plan": request.requested_plan},
    )
    await db.commit()
    return request_response(request)


async def get_pending_subscription_request(db: AsyncSession, request_id: str) -> SubscriptionRequestModel:
    result = await db.execute(
        select(SubscriptionRequestModel)
        .options(joinedload(SubscriptionRequestModel.user).raiseload("*"))
        .where(SubscriptionRequestModel.id == request_id)
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription request not found")
    if request.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Subscription request has already been reviewed")
    return request


@router.get("/content", response_model=list[AdminLocalizedContent])
async def list_admin_content(
    language: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None),
    published: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> list[AdminLocalizedContent]:
    statement = select(LocalizedContentModel)
    if language:
        statement = statement.where(LocalizedContentModel.language == language)
    if region:
        statement = statement.where(LocalizedContentModel.region == region)
    if content_type:
        statement = statement.where(LocalizedContentModel.content_type == content_type)
    if published is not None:
        statement = statement.where(LocalizedContentModel.published == published)

    rows = await db.execute(statement.order_by(LocalizedContentModel.updated_at.desc()).offset(offset).limit(limit))
    return [content_response(item) for item in rows.scalars().all()]


@router.post("/content", response_model=AdminLocalizedContent, status_code=status.HTTP_201_CREATED)
async def create_admin_content(
    payload: AdminLocalizedContentPayload,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminLocalizedContent:
    item = LocalizedContentModel(**payload.model_dump())
    db.add(item)
    await log_admin_event(db, admin_user=admin_user, action="content.created", target_type="localized_content", target_id=item.id, metadata={"title": item.title})
    await db.commit()
    await db.refresh(item)
    return content_response(item)


@router.patch("/content/{content_id}", response_model=AdminLocalizedContent)
async def update_admin_content(
    content_id: str,
    payload: AdminLocalizedContentUpdate,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminLocalizedContent:
    result = await db.execute(select(LocalizedContentModel).where(LocalizedContentModel.id == content_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    changes = payload.model_dump(exclude_unset=True)
    before = {key: getattr(item, key) for key in changes}
    for key, value in changes.items():
        setattr(item, key, value)

    await log_admin_event(db, admin_user=admin_user, action="content.updated", target_type="localized_content", target_id=item.id, metadata={"before": before, "after": changes})
    await db.commit()
    await db.refresh(item)
    return content_response(item)


@router.delete("/content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_content(
    content_id: str,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(LocalizedContentModel).where(LocalizedContentModel.id == content_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    await log_admin_event(db, admin_user=admin_user, action="content.deleted", target_type="localized_content", target_id=item.id, metadata={"title": item.title})
    await db.delete(item)
    await db.commit()


@router.get("/crisis-resources", response_model=list[AdminCrisisResource])
async def list_admin_crisis_resources(
    language: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> list[AdminCrisisResource]:
    statement = select(CrisisResourceModel)
    if language:
        statement = statement.where(CrisisResourceModel.language == language)
    if region:
        statement = statement.where(CrisisResourceModel.region == region)
    if active is not None:
        statement = statement.where(CrisisResourceModel.active == active)

    rows = await db.execute(statement.order_by(CrisisResourceModel.name))
    return [crisis_resource_response(resource) for resource in rows.scalars().all()]


@router.post("/crisis-resources", response_model=AdminCrisisResource, status_code=status.HTTP_201_CREATED)
async def create_admin_crisis_resource(
    payload: AdminCrisisResourcePayload,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminCrisisResource:
    resource = CrisisResourceModel(**payload.model_dump())
    db.add(resource)
    await log_admin_event(db, admin_user=admin_user, action="crisis_resource.created", target_type="crisis_resource", target_id=resource.id, metadata={"name": resource.name})
    await db.commit()
    await db.refresh(resource)
    return crisis_resource_response(resource)


@router.patch("/crisis-resources/{resource_id}", response_model=AdminCrisisResource)
async def update_admin_crisis_resource(
    resource_id: str,
    payload: AdminCrisisResourceUpdate,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminCrisisResource:
    result = await db.execute(select(CrisisResourceModel).where(CrisisResourceModel.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crisis resource not found")

    changes = payload.model_dump(exclude_unset=True)
    before = {key: getattr(resource, key) for key in changes}
    for key, value in changes.items():
        setattr(resource, key, value)

    await log_admin_event(db, admin_user=admin_user, action="crisis_resource.updated", target_type="crisis_resource", target_id=resource.id, metadata={"before": before, "after": changes})
    await db.commit()
    await db.refresh(resource)
    return crisis_resource_response(resource)


@router.get("/safety-reviews", response_model=list[AdminSafetyReview])
async def list_admin_safety_reviews(
    review_status: Optional[str] = Query(None, alias="status"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> list[AdminSafetyReview]:
    statement = (
        select(Message, Conversation, SafetyReviewModel)
        .join(Conversation, Conversation.id == Message.conversation_id)
        .outerjoin(SafetyReviewModel, SafetyReviewModel.message_id == Message.id)
        .where(Message.crisis_flag.is_(True))
    )
    if review_status:
        if review_status not in VALID_SAFETY_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid safety status")
        if review_status == "open":
            statement = statement.where((SafetyReviewModel.id.is_(None)) | (SafetyReviewModel.status == "open"))
        else:
            statement = statement.where(SafetyReviewModel.status == review_status)

    rows = await db.execute(statement.order_by(Message.created_at.desc()).offset(offset).limit(limit))
    return [safety_review_response(message, conversation, review) for message, conversation, review in rows.all()]


@router.post("/safety-reviews/{message_id}/review", response_model=AdminSafetyReview)
async def review_admin_safety_message(
    message_id: str,
    payload: AdminSafetyReviewPayload,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminSafetyReview:
    if payload.status not in VALID_SAFETY_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid safety status")

    row = await db.execute(
        select(Message, Conversation)
        .join(Conversation, Conversation.id == Message.conversation_id)
        .where(Message.id == message_id)
        .where(Message.crisis_flag.is_(True))
    )
    result = row.one_or_none()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crisis message not found")
    message, conversation = result

    review_row = await db.execute(select(SafetyReviewModel).where(SafetyReviewModel.message_id == message_id))
    review = review_row.scalar_one_or_none()
    if not review:
        review = SafetyReviewModel(message_id=message_id)
        db.add(review)

    review.status = payload.status
    review.escalation_level = payload.escalation_level
    review.admin_note = payload.admin_note.strip() if payload.admin_note else None
    review.reviewed_by = admin_user.id
    review.reviewed_at = datetime.now(timezone.utc)

    await log_admin_event(db, admin_user=admin_user, action="safety_review.updated", target_type="message", target_id=message_id, metadata={"status": review.status, "escalation_level": review.escalation_level})
    await db.commit()
    return safety_review_response(message, conversation, review)


@router.get("/moderation/community-posts", response_model=list[AdminCommunityPost])
async def list_admin_community_posts(
    moderation_status: Optional[str] = Query(None, alias="status"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> list[AdminCommunityPost]:
    statement = (
        select(CommunityPost, User.name, User.email, Community.name)
        .join(User, User.id == CommunityPost.user_id)
        .join(Community, Community.id == CommunityPost.community_id)
    )
    if moderation_status:
        statement = statement.where(CommunityPost.moderation_status == moderation_status)

    rows = await db.execute(statement.order_by(CommunityPost.created_at.desc()).offset(offset).limit(limit))
    return [community_post_response(post, author_name, author_email, community_name) for post, author_name, author_email, community_name in rows.all()]


@router.post("/moderation/community-posts/{post_id}/hide", response_model=AdminCommunityPost)
async def hide_admin_community_post(
    post_id: str,
    payload: AdminModerationAction,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminCommunityPost:
    return await set_community_post_moderation(db, admin_user, post_id, "hidden", payload.reason)


@router.post("/moderation/community-posts/{post_id}/restore", response_model=AdminCommunityPost)
async def restore_admin_community_post(
    post_id: str,
    payload: AdminModerationAction,
    admin_user: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminCommunityPost:
    return await set_community_post_moderation(db, admin_user, post_id, "visible", payload.reason)


async def set_community_post_moderation(
    db: AsyncSession,
    admin_user: User,
    post_id: str,
    moderation_status: str,
    reason: str | None,
) -> AdminCommunityPost:
    row = await db.execute(
        select(CommunityPost, User.name, User.email, Community.name)
        .join(User, User.id == CommunityPost.user_id)
        .join(Community, Community.id == CommunityPost.community_id)
        .where(CommunityPost.id == post_id)
    )
    result = row.one_or_none()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community post not found")
    post, author_name, author_email, community_name = result

    now = datetime.now(timezone.utc)
    post.moderation_status = moderation_status
    post.moderation_reason = reason.strip() if reason else None
    post.reviewed_at = now
    post.hidden_at = now if moderation_status == "hidden" else None
    post.hidden_by = admin_user.id if moderation_status == "hidden" else None

    await log_admin_event(db, admin_user=admin_user, action=f"community_post.{moderation_status}", target_type="community_post", target_id=post.id, metadata={"reason": post.moderation_reason})
    await db.commit()
    return community_post_response(post, author_name, author_email, community_name)


@router.get("/analytics", response_model=AdminAnalytics)
async def get_admin_analytics(
    range_days: int = Query(30, alias="range", ge=7, le=90),
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminAnalytics:
    since_dt = datetime.now(timezone.utc) - timedelta(days=range_days)
    since_day = since_dt.date()

    total_messages = await db.scalar(select(func.count(Message.id)).where(Message.created_at >= since_dt))
    crisis_messages = await db.scalar(select(func.count(Message.id)).where(Message.created_at >= since_dt, Message.crisis_flag.is_(True)))
    mood_logs = await db.scalar(select(func.count(MoodLog.id)).where(MoodLog.created_at >= since_dt))
    journals = await db.scalar(select(func.count(Journal.id)).where(Journal.created_at >= since_dt))
    active_habits = await db.scalar(select(func.count(Habit.id)).where(Habit.is_active.is_(True)))
    usage_quantity = await db.scalar(select(func.coalesce(func.sum(UsageEvent.quantity), 0)).where(UsageEvent.created_at >= since_dt))
    average_mood = await db.scalar(select(func.avg(MoodLog.mood)).where(MoodLog.created_at >= since_dt))

    plan_rows = await db.execute(select(User.plan, func.count(User.id)).group_by(User.plan))
    request_rows = await db.execute(select(SubscriptionRequestModel.status, func.count(SubscriptionRequestModel.id)).group_by(SubscriptionRequestModel.status))
    safety_rows = await db.execute(select(SafetyReviewModel.status, func.count(SafetyReviewModel.id)).group_by(SafetyReviewModel.status))

    daily = await build_daily_analytics(db, since_day, range_days)

    return AdminAnalytics(
        range_days=range_days,
        totals={
            "messages": total_messages or 0,
            "crisis_messages": crisis_messages or 0,
            "mood_logs": mood_logs or 0,
            "journals": journals or 0,
            "active_habits": active_habits or 0,
            "usage_quantity": usage_quantity or 0,
            "average_mood": round(float(average_mood or 0), 2),
        },
        plan_counts={plan: count for plan, count in plan_rows.all()},
        subscription_request_counts={request_status: count for request_status, count in request_rows.all()},
        safety_counts={safety_status: count for safety_status, count in safety_rows.all()},
        daily=daily,
    )


async def build_daily_analytics(db: AsyncSession, since_day: date, range_days: int) -> list[AdminAnalyticsPoint]:
    points = {
        (since_day + timedelta(days=offset)).isoformat(): AdminAnalyticsPoint(date=(since_day + timedelta(days=offset)).isoformat())
        for offset in range(range_days + 1)
    }

    async def apply_counts(model, column_name: str, target_field: str, where_clause=None) -> None:
        date_column = func.date(column_name)
        statement = select(date_column, func.count(model.id)).where(column_name >= datetime.combine(since_day, datetime.min.time(), tzinfo=timezone.utc))
        if where_clause is not None:
            statement = statement.where(where_clause)
        rows = await db.execute(statement.group_by(date_column))
        for day, count in rows.all():
            key = str(day)
            if key in points:
                setattr(points[key], target_field, count)

    await apply_counts(User, User.created_at, "users")
    await apply_counts(MoodLog, MoodLog.created_at, "mood_logs")
    await apply_counts(Message, Message.created_at, "messages")
    await apply_counts(Message, Message.created_at, "crisis_messages", Message.crisis_flag.is_(True))
    await apply_counts(UsageEvent, UsageEvent.created_at, "usage_events")
    return list(points.values())


@router.get("/system-health", response_model=AdminSystemHealth)
async def get_admin_system_health(
    request: Request,
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> AdminSystemHealth:
    settings = get_settings()

    try:
        await db.execute(text("select 1"))
        database_status = "connected"
    except Exception:
        database_status = "unavailable"

    redis_client = getattr(request.app.state, "redis", None)
    redis_status = "unavailable"
    if redis_client:
        try:
            await redis_client.ping()
            redis_status = "connected"
        except Exception:
            redis_status = "unavailable"

    pinecone_status = "connected" if getattr(request.app.state, "pinecone_index", None) else "unavailable"

    return AdminSystemHealth(
        status="healthy" if database_status == "connected" else "degraded",
        service="sathi-api",
        environment=settings.APP_ENV,
        database=database_status,
        redis=redis_status,
        pinecone=pinecone_status,
        audit_table="configured",
        safety_table="configured",
    )


@router.get("/audit-events", response_model=list[AdminAuditEvent])
async def list_admin_audit_events(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _: User = Depends(ADMIN_ONLY),
    db: AsyncSession = Depends(get_db),
) -> list[AdminAuditEvent]:
    rows = await db.execute(select(AdminAuditEventModel).order_by(AdminAuditEventModel.created_at.desc()).offset(offset).limit(limit))
    return [audit_response(event) for event in rows.scalars().all()]
