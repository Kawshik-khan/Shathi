"""Translation API routes."""

from fastapi import APIRouter, Query

from app.schemas.localization import TranslationResponse
from app.services.localization import normalize_language

router = APIRouter()

TRANSLATIONS = {
    "en": {
        "navigation": {
            "dashboard": "Dashboard",
            "aiCompanion": "AI Companion",
            "mood": "Mood",
            "journal": "Journal",
            "resources": "Resources",
        },
        "actions": {
            "login": "Log in",
            "register": "Register",
            "submit": "Submit",
        },
    },
    "bn": {
        "navigation": {
            "dashboard": "ড্যাশবোর্ড",
            "aiCompanion": "এআই সঙ্গী",
            "mood": "মুড",
            "journal": "জার্নাল",
            "resources": "রিসোর্স",
        },
        "actions": {
            "login": "লগ ইন",
            "register": "রেজিস্টার",
            "submit": "জমা দিন",
        },
    },
}


@router.get("/translations", response_model=TranslationResponse)
async def get_translations(language: str = Query("en")) -> TranslationResponse:
    """Get translations for a supported language."""
    selected_language = normalize_language(language)
    return TranslationResponse(
        language=selected_language,
        translations=TRANSLATIONS[selected_language],
    )
