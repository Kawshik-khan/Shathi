"""Main API router that combines all sub-routers."""
from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.mood import router as mood_router
from app.api.journal import router as journal_router
from app.api.habits import router as habits_router
from app.api.user import router as user_router
from app.api.academic import router as academic_router
from app.api.communities import router as communities_router
from app.api.content import router as content_router
from app.api.crisis import router as crisis_router
from app.api.families import router as families_router
from app.api.i18n import router as i18n_router
from app.api.offline import router as offline_router
from app.api.sms import router as sms_router
from app.api.subscription_requests import router as subscription_requests_router

# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(user_router, prefix="/users", tags=["users"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(mood_router, prefix="/mood", tags=["mood"])
api_router.include_router(journal_router, prefix="/journal", tags=["journal"])
api_router.include_router(habits_router, prefix="/habits", tags=["habits"])
api_router.include_router(i18n_router, prefix="/i18n", tags=["i18n"])
api_router.include_router(content_router, prefix="/content", tags=["content"])
api_router.include_router(crisis_router, prefix="/crisis", tags=["crisis"])
api_router.include_router(academic_router, prefix="/academic", tags=["academic"])
api_router.include_router(families_router, prefix="/families", tags=["families"])
api_router.include_router(communities_router, prefix="/communities", tags=["communities"])
api_router.include_router(offline_router, prefix="/offline", tags=["offline"])
api_router.include_router(sms_router, prefix="/sms", tags=["sms"])
api_router.include_router(
    subscription_requests_router,
    prefix="/subscription-requests",
    tags=["subscription-requests"],
)

