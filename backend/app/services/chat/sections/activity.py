"""Activity section provider.

Recent app activity events summarized as counters for known event
types. Uses the ``idx_app_activity_user_occurred_desc`` index.
"""
from __future__ import annotations

import logging
from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.mood_signal import AppActivityEvent
from app.services.chat.cache import get_section, set_section
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)

logger = logging.getLogger(__name__)

SECTION_NAME = "activity"

_TRACKED_EVENTS = {
    "social_withdrawal",
    "routine_missed",
    "productivity_missed",
    "productivity_completed",
    "exercise",
    "meditation",
}


def _format(events: list[AppActivityEvent]) -> tuple[list[str], int]:
    parts: list[str] = []
    if not events:
        return parts, 0

    counts = Counter(event.event_type for event in events)
    if counts:
        top = ", ".join(f"{kind}={n}" for kind, n in counts.most_common(6))
        parts.append(f"Recent app activity events ({len(events)} total): {top}.")

    late = sum(
        1
        for event in events
        if 0 <= event.occurred_at.astimezone(timezone.utc).hour < 5
    )
    if late >= 2:
        parts.append(f"Late-night activity events (00:00-05:00 UTC): {late}.")

    latest = max(event.occurred_at for event in events)
    if latest < datetime.now(timezone.utc) - timedelta(days=3):
        parts.append(
            f"No activity logged since {latest.date().isoformat()} "
            "(consider prompting gently about routine)."
        )
    return parts, sum(len(p.split()) for p in parts)


async def _load(ctx: ProviderContext) -> ContextResult:
    cached = await get_section(ctx.user_id, SECTION_NAME, ctx.redis)
    if cached:
        return ContextResult(
            name=SECTION_NAME,
            cached=True,
            parts=cached["parts"],
            tokens=cached["tokens"],
        )

    db: AsyncSession = ctx.db
    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    result = await db.execute(
        select(AppActivityEvent)
        .where(
            AppActivityEvent.user_id == ctx.user_id,
            AppActivityEvent.occurred_at >= cutoff,
        )
        .order_by(desc(AppActivityEvent.occurred_at))
        .limit(100)
    )
    events = list(result.scalars().all())
    parts, tokens = _format(events)

    await set_section(
        ctx.user_id,
        SECTION_NAME,
        {"parts": parts, "tokens": tokens},
        ctx.redis,
    )
    return ContextResult(name=SECTION_NAME, parts=parts, tokens=tokens)


async def build(ctx: ProviderContext) -> ContextResult:
    settings = get_settings()
    return await run_provider(SECTION_NAME, _load, ctx, timeout_ms=settings.CHAT_PROVIDER_TIMEOUT_MS)