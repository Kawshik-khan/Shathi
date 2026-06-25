"""Journal section provider.

Latest journal entries with emotion summary, sentiment, and AI insights
already pre-computed by previous journal flows.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.journal import Journal
from app.services.chat.cache import get_section, set_section
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)

logger = logging.getLogger(__name__)

SECTION_NAME = "journal"


def _format(entries: list[Journal]) -> tuple[list[str], int]:
    parts: list[str] = []
    if not entries:
        return parts, 0

    parts.append(f"Recent journal entries ({len(entries)}):")
    for entry in entries[:3]:
        line = f"- {entry.written_at.date().isoformat() if entry.written_at else 'unknown'}"
        if entry.emotion_summary:
            line += f" | emotion: {entry.emotion_summary[:80]}"
        if entry.sentiment_score is not None:
            line += f" | sentiment: {entry.sentiment_score:.2f}"
        if entry.ai_insights:
            line += f" | insight: {entry.ai_insights[:80]}"
        parts.append(line)

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
        select(Journal)
        .where(Journal.user_id == ctx.user_id, Journal.written_at >= cutoff)
        .order_by(desc(Journal.written_at))
        .limit(3)
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