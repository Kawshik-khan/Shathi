"""Inferred mood section provider.

Runs the parallelized ``infer_mood_from_signals_parallel`` so all 6
signal queries (messages, journals, reflections, activities, sleeps,
habits) execute concurrently. The heuristic downstream is unchanged.
"""
from __future__ import annotations

import logging

from app.core.config import get_settings
from app.services.chat.cache import get_section, set_section
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)
from app.services.mood_inference import infer_mood_from_signals_parallel

logger = logging.getLogger(__name__)

SECTION_NAME = "inferred_mood"


def _format(result) -> tuple[list[str], int]:
    parts: list[str] = []
    state = result.state
    confidence = result.confidence
    parts.append(
        f"Inferred mood state: {state} (confidence={confidence}, "
        f"tone={result.support_tone})."
    )
    if result.reason_en:
        parts.append(f"Reason: {result.reason_en[:160]}")
    counts = result.source_counts or {}
    if counts:
        rendered = ", ".join(f"{k}={v}" for k, v in counts.items())
        parts.append(f"Evidence source counts: {rendered}.")
    top_evidence = result.evidence[:3] if result.evidence else []
    for item in top_evidence:
        parts.append(f"- {item.category}: {item.reason_en[:100]}")
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

    settings = get_settings()
    result = await infer_mood_from_signals_parallel(
        db=ctx.db,
        user_id=ctx.user_id,
        days=14,
        timeout_ms=settings.CHAT_PROVIDER_TIMEOUT_MS,
    )
    parts, tokens = _format(result)
    payload = {
        "parts": parts,
        "tokens": tokens,
        "state": result.state,
        "confidence": result.confidence,
        "support_tone": result.support_tone,
    }
    await set_section(
        ctx.user_id,
        SECTION_NAME,
        payload,
        ctx.redis,
    )
    return ContextResult(name=SECTION_NAME, parts=parts, tokens=tokens, data=payload)


async def build(ctx: ProviderContext) -> ContextResult:
    settings = get_settings()
    return await run_provider(SECTION_NAME, _load, ctx, timeout_ms=settings.CHAT_PROVIDER_TIMEOUT_MS)