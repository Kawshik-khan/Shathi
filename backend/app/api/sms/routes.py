"""SMS integration routes."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/checkin")
async def sms_checkin(payload: dict) -> dict:
    """Receive an SMS check-in payload from a gateway integration."""
    return {
        "status": "received",
        "phone": payload.get("phone"),
        "message": payload.get("message"),
    }
