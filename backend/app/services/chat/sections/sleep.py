"""Sleep section provider.

Recent sleep entries (timing + duration) summarized as averages. Uses
the new ``idx_sleep_user_slept_desc`` composite index for the trailing
30-day window.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.mood_signal import SleepTimingEntry
from app.services.chat.cache import get_section, set_section
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)

logger = logging.getLogger(__name__)

SECTION_NAME = "sleep"


def _format(entries: list[SleepTimingEntry]) -> tuple[list[str], int]:
    parts: list[str] = []
    if not entries:
        return parts, 0

    durations = [
        entry.duration_minutes
        for entry in entries
        if entry.duration_minutes is not None
    ]
    if durations:
        avg = round(sum(durations) / len(durations))
        parts.append(f"Sleep avg duration: {avg} min over last {len(entries)} nights.")
    else:
        parts.append(f"Sleep entries: {len(entries)} (no durations recorded).")

    short = sum(1 for d in durations if d < 360)
    if short:
        parts.append(f"Short-sleep nights (<6h): {short}.")

    latest = entries[0]
    if latest.slept_at:
        parts.append(
            f"Last sleep start: {latest.slept_at.astimezone(timezone.utc).isoformat()}."
        )
    if latest.quality_note:
        parts.append(f"Quality note: {latest.quality_note[:120]}")
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
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(SleepTimingEntry)
        .where(
            SleepTimingEntry.user_id == ctx.user_id,
            SleepTimingEntry.slept_at >= cutoff,
        )
        .order_by(desc(SleepTimingEntry.slept_at))
        .limit(30)
    )
    entries = list(result.scalars().all())
    parts, tokens = _format(entries)

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