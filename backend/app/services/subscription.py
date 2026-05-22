"""Plan entitlement and usage helpers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.habit import Habit
from app.models.subscription import UsageEvent
from app.models.user import User


ACTIVE_SUBSCRIPTION_STATUSES = {"active", "trialing"}

PLAN_LIMITS: dict[str, dict[str, Any]] = {
    "free": {
        "ai_messages_per_month": 50,
        "habits_limit": 3,
        "journal_history_days": 30,
        "ai_memory": False,
        "voice_chat": False,
        "family_members": 0,
        "advanced_insights": False,
    },
    "premium": {
        "ai_messages_per_month": 1000,
        "habits_limit": None,
        "journal_history_days": None,
        "ai_memory": True,
        "voice_chat": True,
        "family_members": 0,
        "advanced_insights": True,
    },
    "family": {
        "ai_messages_per_month": 2000,
        "habits_limit": None,
        "journal_history_days": None,
        "ai_memory": True,
        "voice_chat": True,
        "family_members": 6,
        "advanced_insights": True,
    },
}

USAGE_FEATURE_AI_MESSAGE = "ai_message"


class FeatureLimitExceeded(ValueError):
    """Raised when a user's active plan does not allow more feature usage."""

    def __init__(self, feature_key: str, limit: int | None = None) -> None:
        self.feature_key = feature_key
        self.limit = limit
        if limit is None:
            message = f"Your plan does not include {feature_key}."
        else:
            message = f"Your plan limit for {feature_key} is {limit}."
        super().__init__(message)


def current_period_start(now: datetime | None = None) -> datetime:
    """Return the UTC month boundary used for monthly metered usage."""
    current = now or datetime.now(timezone.utc)
    return current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def get_effective_plan(user: User) -> str:
    """Return the plan that should be enforced for this user right now."""
    plan = user.plan if user.plan in PLAN_LIMITS else "free"
    if plan == "free":
        return "free"
    if user.subscription_status not in ACTIVE_SUBSCRIPTION_STATUSES:
        return "free"
    return plan


def get_plan_limits(user: User) -> dict[str, Any]:
    """Return a copy of the current user's enforceable limits."""
    return dict(PLAN_LIMITS[get_effective_plan(user)])


def has_feature(user: User, feature_key: str) -> bool:
    """Return whether a boolean or seat-count feature is enabled."""
    value = get_plan_limits(user).get(feature_key)
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value > 0
    return value is None


async def get_usage_total(
    db: AsyncSession,
    user_id: str,
    feature_key: str,
    period_start: datetime | None = None,
) -> int:
    """Return usage quantity for the current metering period."""
    period = period_start or current_period_start()
    total = await db.scalar(
        select(func.coalesce(func.sum(UsageEvent.quantity), 0)).where(
            UsageEvent.user_id == user_id,
            UsageEvent.feature_key == feature_key,
            UsageEvent.period_start == period,
        )
    )
    return int(total or 0)


async def record_usage_event(
    db: AsyncSession,
    user_id: str,
    feature_key: str,
    quantity: int = 1,
    period_start: datetime | None = None,
) -> UsageEvent:
    """Persist one feature usage event."""
    event = UsageEvent(
        user_id=user_id,
        feature_key=feature_key,
        quantity=quantity,
        period_start=period_start or current_period_start(),
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def assert_ai_message_quota(
    db: AsyncSession,
    user: User,
    quantity: int = 1,
) -> None:
    """Raise if the user has exhausted monthly AI message usage."""
    limit = get_plan_limits(user)["ai_messages_per_month"]
    if limit is None:
        return

    used = await get_usage_total(db, user.id, USAGE_FEATURE_AI_MESSAGE)
    if used + quantity > limit:
        raise FeatureLimitExceeded("AI messages", limit)


async def assert_habit_create_allowed(db: AsyncSession, user: User) -> None:
    """Raise if the current plan has reached its active habit cap."""
    limit = get_plan_limits(user)["habits_limit"]
    if limit is None:
        return

    active_count = await db.scalar(
        select(func.count(Habit.id)).where(
            Habit.user_id == user.id,
            Habit.is_active == True,
        )
    )
    if int(active_count or 0) >= limit:
        raise FeatureLimitExceeded("active habits", limit)


def assert_feature_enabled(user: User, feature_key: str) -> None:
    """Raise if the current plan does not include a non-metered feature."""
    if not has_feature(user, feature_key):
        raise FeatureLimitExceeded(feature_key)


async def build_subscription_summary(
    db: AsyncSession,
    user: User,
) -> dict[str, Any]:
    """Build a frontend-friendly plan summary for the current user."""
    limits = get_plan_limits(user)
    usage = {
        "ai_messages_this_month": await get_usage_total(
            db,
            user.id,
            USAGE_FEATURE_AI_MESSAGE,
        ),
    }
    entitlements = {
        "ai_memory": has_feature(user, "ai_memory"),
        "voice_chat": has_feature(user, "voice_chat"),
        "family_accounts": has_feature(user, "family_members"),
        "advanced_insights": has_feature(user, "advanced_insights"),
    }
    return {
        "plan": user.plan,
        "effective_plan": get_effective_plan(user),
        "subscription_status": user.subscription_status,
        "system_role": user.system_role,
        "subscription_started_at": user.subscription_started_at,
        "subscription_ends_at": user.subscription_ends_at,
        "limits": limits,
        "usage": usage,
        "entitlements": entitlements,
    }
