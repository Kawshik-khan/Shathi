"""Memory section provider.

Pulls the top-K relevant long-term memories from Pinecone (memory
namespace). Embedding + retrieval is the slowest provider by far, so
it is isolated and aggressively cached.
"""
from __future__ import annotations

import logging
from typing import Any

from app.core.config import get_settings
from app.services.chat.cache import get_section, set_section
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)
from app.services.memory import retrieve_relevant_memories

logger = logging.getLogger(__name__)

SECTION_NAME = "memory"


def _format(memories: list[dict[str, Any]]) -> tuple[list[str], int]:
    parts: list[str] = []
    if not memories:
        return parts, 0

    parts.append(f"Relevant memories ({len(memories)}):")
    for memory in memories[:5]:
        text = memory.get("memory_text", "")
        emotion = memory.get("emotion", "neutral")
        score = memory.get("score")
        if text:
            prefix = f"- [{emotion}"
            if score is not None:
                prefix += f" score={float(score):.2f}"
            prefix += "] "
            parts.append(prefix + text[:200])
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

    memories = await retrieve_relevant_memories(
        user_id=ctx.user_id,
        query=ctx.query,
        top_k=5,
        pinecone_index=getattr(ctx, "pinecone_index", None),
    )
    parts, tokens = _format(memories)

    await set_section(
        ctx.user_id,
        SECTION_NAME,
        {"parts": parts, "tokens": tokens, "query": ctx.query[:200]},
        ctx.redis,
    )
    return ContextResult(name=SECTION_NAME, parts=parts, tokens=tokens)


async def build(ctx: ProviderContext) -> ContextResult:
    settings = get_settings()
    return await run_provider(SECTION_NAME, _load, ctx, timeout_ms=settings.CHAT_PROVIDER_TIMEOUT_MS)