"""Offline sync and SMS check-in routes."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.post("/sync")
async def sync_offline_data(
    payload: dict,
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Accept queued offline client data for later processing."""
    records = payload.get("records", [])
    return {
        "status": "accepted",
        "user_id": current_user.id,
        "synced_records": len(records) if isinstance(records, list) else 0,
    }


@router.post("/sms/checkin")
async def sms_checkin(payload: dict) -> dict:
    """Receive an SMS check-in payload from a gateway integration."""
    return {
        "status": "received",
        "phone": payload.get("phone"),
        "message": payload.get("message"),
    }
