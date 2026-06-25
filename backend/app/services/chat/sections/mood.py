"""Mood section provider.

Recent numeric ``MoodLog`` entries with a trend summary. These are
the user-entered mood ratings (1-10 scale), distinct from inferred
mood produced from text + behavior signals.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.mood import MoodLog
from app.services.chat.cache import get_section, set_section
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)

logger = logging.getLogger(__name__)

SECTION_NAME = "mood"


def _format(entries: list[MoodLog]) -> tuple[list[str], int]:
    parts: list[str] = []
    if not entries:
        return parts, 0

    recent = entries[:8]
    moods = [entry.mood for entry in recent if entry.mood is not None]
    avg = round(sum(moods) / len(moods), 1) if moods else None
    parts.append(
        f"Recent mood ratings (1-10, last {len(recent)} entries): "
        + ", ".join(str(entry.mood) for entry in recent[:6])
        + "."
    )
    if avg is not None:
        parts.append(f"Recent mood average: {avg}/10.")
    latest = recent[0]
    if latest.logged_at:
        parts.append(f"Latest mood logged at {latest.logged_at.isoformat()}.")
    if latest.note:
        parts.append(f"Latest mood note: {latest.note[:160]}")

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
        select(MoodLog)
        .where(MoodLog.user_id == ctx.user_id, MoodLog.logged_at >= cutoff)
        .order_by(desc(MoodLog.logged_at))
        .limit(8)
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
