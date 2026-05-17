"""Main API router that combines all sub-routers."""
from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.mood import router as mood_router
from app.api.journal import router as journal_router
from app.api.habits import router as habits_router
from app.api.user import router as user_router

# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(user_router, prefix="/users", tags=["users"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(mood_router, prefix="/mood", tags=["mood"])
api_router.include_router(journal_router, prefix="/journal", tags=["journal"])
api_router.include_router(habits_router, prefix="/habits", tags=["habits"])

