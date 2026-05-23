from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.admin.routes import (
    approve_admin_subscription_request,
    get_admin_token_usage,
    hide_admin_community_post,
    review_admin_safety_message,
    reject_admin_subscription_request,
    update_admin_user,
)
from app.schemas.admin import (
    AdminModerationAction,
    AdminSafetyReviewPayload,
    AdminSubscriptionRequestReview,
    AdminUserUpdate,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


NOW = datetime(2026, 5, 22, tzinfo=timezone.utc)


def make_user(**overrides):
    values = {
        "id": "user-1",
        "email": "user@example.com",
        "name": "User One",
        "avatar_url": None,
        "is_active": True,
        "system_role": "user",
        "plan": "free",
        "subscription_status": "active",
        "subscription_started_at": None,
        "subscription_ends_at": None,
        "created_at": NOW,
        "updated_at": NOW,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def make_request(user=None, **overrides):
    values = {
        "id": "request-1",
        "user_id": "user-1",
        "requested_plan": "premium",
        "status": "pending",
        "message": "Please upgrade me",
        "admin_note": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "created_at": NOW,
        "updated_at": NOW,
        "user": user or make_user(),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class Result:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value

    def one_or_none(self):
        return self.value

    def one(self):
        return self.value

    def all(self):
        return self.value


class DB:
    def __init__(self, value):
        self.value = value
        self.added = []
        self.committed = False
        self.refreshed = None

    async def execute(self, _statement):
        return Result(self.value)

    def add(self, value):
        self.added.append(value)

    async def commit(self):
        self.committed = True

    async def refresh(self, value):
        self.refreshed = value


class SequenceDB(DB):
    def __init__(self, values):
        super().__init__(None)
        self.values = list(values)

    async def execute(self, _statement):
        return Result(self.values.pop(0))


@pytest.mark.anyio
async def test_approve_subscription_request_updates_request_user_and_audit_event():
    user = make_user()
    request = make_request(user=user)
    admin = make_user(id="admin-1", system_role="admin")
    db = DB(request)

    response = await approve_admin_subscription_request(
        request.id,
        AdminSubscriptionRequestReview(admin_note="Approved"),
        admin_user=admin,
        db=db,
    )

    assert response.status == "approved"
    assert response.reviewed_by == "admin-1"
    assert request.admin_note == "Approved"
    assert user.plan == "premium"
    assert user.subscription_status == "active"
    assert db.committed is True
    assert db.added[0].action == "subscription_request.approved"


@pytest.mark.anyio
async def test_reject_subscription_request_does_not_change_user_plan():
    user = make_user(plan="free")
    request = make_request(user=user)
    admin = make_user(id="admin-1", system_role="admin")
    db = DB(request)

    response = await reject_admin_subscription_request(
        request.id,
        AdminSubscriptionRequestReview(admin_note="Not eligible"),
        admin_user=admin,
        db=db,
    )

    assert response.status == "rejected"
    assert user.plan == "free"
    assert db.committed is True
    assert db.added[0].action == "subscription_request.rejected"


@pytest.mark.anyio
async def test_admin_cannot_remove_own_admin_role():
    admin = make_user(id="admin-1", system_role="admin")
    db = DB(admin)

    with pytest.raises(HTTPException) as exc_info:
        await update_admin_user(
            admin.id,
            AdminUserUpdate(system_role="user"),
            admin_user=admin,
            db=db,
        )

    assert exc_info.value.status_code == 400
    assert db.committed is False


@pytest.mark.anyio
async def test_review_safety_message_creates_review_and_audit_event():
    message = SimpleNamespace(
        id="message-1",
        content="I might hurt myself tonight",
        emotion="sad",
        crisis_severity="high",
        model_used="crisis-safety",
        created_at=NOW,
    )
    conversation = SimpleNamespace(
        id="conversation-1",
        user_id="user-1",
        language="en",
    )
    admin = make_user(id="admin-1", system_role="admin")
    db = SequenceDB([(message, conversation), None])

    response = await review_admin_safety_message(
        message.id,
        AdminSafetyReviewPayload(
            status="escalated",
            escalation_level="high",
            admin_note="Follow up",
        ),
        admin_user=admin,
        db=db,
    )

    review = db.added[0]
    assert response.status == "escalated"
    assert response.message_id == "message-1"
    assert review.reviewed_by == "admin-1"
    assert db.added[1].action == "safety_review.updated"
    assert db.committed is True


@pytest.mark.anyio
async def test_hide_community_post_updates_moderation_fields_and_audit_event():
    post = SimpleNamespace(
        id="post-1",
        user_id="user-1",
        community_id="community-1",
        content="Unsafe community content",
        language="en",
        is_anonymous=False,
        moderation_status="visible",
        moderation_reason=None,
        hidden_at=None,
        hidden_by=None,
        reviewed_at=None,
        created_at=NOW,
    )
    admin = make_user(id="admin-1", system_role="admin")
    db = SequenceDB([(post, "User One", "user@example.com", "Support")])

    response = await hide_admin_community_post(
        post.id,
        AdminModerationAction(reason="Unsafe"),
        admin_user=admin,
        db=db,
    )

    assert response.moderation_status == "hidden"
    assert post.hidden_by == "admin-1"
    assert post.moderation_reason == "Unsafe"
    assert db.added[0].action == "community_post.hidden"
    assert db.committed is True


@pytest.mark.anyio
async def test_admin_token_usage_returns_totals_user_rows_and_recent_messages():
    admin = make_user(id="admin-1", system_role="admin")
    usage_row = SimpleNamespace(
        id="usage-1",
        user_id="user-1",
        conversation_id="conversation-1",
        user_message_id="message-user-1",
        assistant_message_id="message-ai-1",
        model_used="llama-3.3-70b",
        input_tokens=120,
        output_tokens=45,
        cache_tokens=10,
        total_tokens=165,
        usage_source="estimated",
        created_at=NOW,
    )
    db = SequenceDB(
        [
            (2, 2, 240, 90, 20, 330),
            [("user-1", "User One", "user@example.com", 2, 240, 90, 20, 330, NOW)],
            [(usage_row, "User One", "user@example.com")],
        ]
    )

    response = await get_admin_token_usage(
        range_days=30,
        query=None,
        limit=25,
        offset=0,
        _=admin,
        db=db,
    )

    assert response.totals.user_messages == 2
    assert response.totals.total_tokens == 330
    assert response.users[0].message_count == 2
    assert response.users[0].input_tokens == 240
    assert response.recent_messages[0].assistant_message_id == "message-ai-1"
    assert response.recent_messages[0].usage_source == "estimated"
