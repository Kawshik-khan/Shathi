import pytest
from fastapi import HTTPException

from app.api.subscription_requests.routes import create_subscription_request
from app.schemas.subscription import SubscriptionRequestCreate


@pytest.fixture
def anyio_backend():
    return "asyncio"


def make_user(plan="free", subscription_status="active"):
    return type(
        "User",
        (),
        {
            "id": "user-1",
            "plan": plan,
            "subscription_status": subscription_status,
        },
    )()


class Result:
    def __init__(self, value=None):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class DB:
    def __init__(self, existing=None):
        self.existing = existing
        self.added = None
        self.committed = False
        self.refreshed = None

    async def execute(self, _statement):
        return Result(self.existing)

    def add(self, value):
        self.added = value

    async def commit(self):
        self.committed = True

    async def refresh(self, value):
        self.refreshed = value


@pytest.mark.anyio
async def test_create_subscription_request_rejects_invalid_plan():
    with pytest.raises(HTTPException) as exc_info:
        await create_subscription_request(
            SubscriptionRequestCreate(requested_plan="enterprise"),
            current_user=make_user(),
            db=DB(),
        )

    assert exc_info.value.status_code == 400


@pytest.mark.anyio
async def test_create_subscription_request_rejects_duplicate_pending_request():
    with pytest.raises(HTTPException) as exc_info:
        await create_subscription_request(
            SubscriptionRequestCreate(requested_plan="premium"),
            current_user=make_user(),
            db=DB(existing=object()),
        )

    assert exc_info.value.status_code == 409


@pytest.mark.anyio
async def test_create_subscription_request_persists_pending_request():
    db = DB()

    request = await create_subscription_request(
        SubscriptionRequestCreate(requested_plan="premium", message="Please upgrade me"),
        current_user=make_user(),
        db=db,
    )

    assert request is db.added
    assert db.committed is True
    assert db.refreshed is request
    assert request.user_id == "user-1"
    assert request.requested_plan == "premium"
    assert request.message == "Please upgrade me"
