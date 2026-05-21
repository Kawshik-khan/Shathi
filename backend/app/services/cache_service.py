"""Redis-backed cache helpers for chat user context."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.journal import Journal
from app.models.mood import MoodLog
from app.models.profile import UserProfile

logger = logging.getLogger(__name__)


def _cache_key(user_id: str) -> str:
    return f"user_context:{user_id}"


async def _load_user_context_from_db(db: AsyncSession, user_id: str) -> dict[str, Any]:
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    since = datetime.now(timezone.utc) - timedelta(days=30)
    mood_result = await db.execute(
        select(MoodLog)
        .where(MoodLog.user_id == user_id, MoodLog.logged_at >= since)
        .order_by(desc(MoodLog.logged_at))
        .limit(8)
    )
    moods = list(mood_result.scalars().all())

    journal_result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user_id)
        .order_by(desc(Journal.written_at))
        .limit(3)
    )
    journals = list(journal_result.scalars().all())

    return {
        "profile": {
            "preferred_support_style": profile.preferred_support_style if profile else None,
            "wellness_goals": profile.wellness_goals if profile else None,
            "timezone": profile.timezone if profile else None,
        },
        "moods": [
            {
                "mood": mood.mood,
                "stress": mood.stress,
            }
            for mood in moods
        ],
        "journals": [
            {
                "summary": journal.emotion_summary or journal.ai_insights,
            }
            for journal in journals
            if journal.emotion_summary or journal.ai_insights
        ],
    }


async def get_user_context_cached(
    user_id: str,
    redis,
    db: AsyncSession,
) -> dict[str, Any]:
    """Return compact profile/mood/journal context, using Redis when available."""
    settings = get_settings()
    key = _cache_key(user_id)

    if redis:
        try:
            cached = await redis.get(key)
            if cached:
                return json.loads(cached)
        except Exception as exc:
            logger.warning("User context cache read failed: %s", exc)

    context = await _load_user_context_from_db(db, user_id)

    if redis:
        try:
            await redis.set(
                key,
                json.dumps(context),
                ex=settings.USER_CONTEXT_CACHE_TTL,
            )
        except Exception as exc:
            logger.warning("User context cache write failed: %s", exc)

    return context


async def invalidate_user_context(user_id: str, redis) -> None:
    """Invalidate cached profile/mood/journal context for a user."""
    if not redis:
        return

    try:
        await redis.delete(_cache_key(user_id))
    except Exception as exc:
        logger.warning("User context cache invalidation failed: %s", exc)
