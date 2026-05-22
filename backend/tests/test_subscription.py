from datetime import datetime, timezone

import pytest

from app.services.subscription import (
    FeatureLimitExceeded,
    assert_feature_enabled,
    current_period_start,
    get_effective_plan,
    get_plan_limits,
)


def make_user(plan="free", subscription_status="active"):
    return type(
        "User",
        (),
        {
            "id": "user-1",
            "plan": plan,
            "subscription_status": subscription_status,
            "system_role": "user",
            "subscription_started_at": None,
            "subscription_ends_at": None,
        },
    )()


def test_canceled_premium_falls_back_to_free_limits():
    user = make_user(plan="premium", subscription_status="canceled")

    assert get_effective_plan(user) == "free"
    assert get_plan_limits(user)["ai_messages_per_month"] == 50


def test_premium_enables_ai_memory():
    user = make_user(plan="premium")

    assert get_effective_plan(user) == "premium"
    assert get_plan_limits(user)["ai_memory"] is True


def test_free_plan_rejects_family_accounts():
    user = make_user(plan="free")

    with pytest.raises(FeatureLimitExceeded):
        assert_feature_enabled(user, "family_members")


def test_current_period_start_uses_utc_month_boundary():
    now = datetime(2026, 5, 22, 15, 45, 12, tzinfo=timezone.utc)

    assert current_period_start(now) == datetime(2026, 5, 1, tzinfo=timezone.utc)
