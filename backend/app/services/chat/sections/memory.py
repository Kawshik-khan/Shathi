"""Memory section provider.

Pulls the top-K relevant long-term memories from Pinecone (memory
namespace). Embedding + retrieval is the slowest provider by far, so
it is isolated and aggressively cached.
"""
from __future__ import annotations

import logging
from typing import Any, List, Optional

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

# Short-lived negative cache. When an embeddings call fails we mark
# the user as "embeddings unhealthy" for this window so subsequent
# turns in the same outage don't keep paying the timeout cost. 30s is
# long enough to absorb a burst, short enough that a brief blip
# recovers quickly without the user noticing.
_EMBEDDINGS_UNHEALTHY_TTL_SECONDS = 30


async def _embeddings_unhealthy(user_id: str, redis: Any) -> bool:
    """Return True if a recent embeddings failure should short-circuit."""
    if redis is None:
        return False
    try:
        return bool(await redis.get(f"chat_ctx:emb_unhealthy:{user_id}"))
    except Exception as exc:  # noqa: BLE001 - probe must never raise
        logger.debug("embeddings-unhealthy probe failed: %s", exc)
        return False


async def _mark_embeddings_unhealthy(user_id: str, redis: Any) -> None:
    """Record that the last embeddings attempt failed for this user."""
    if redis is None:
        return
    try:
        await redis.set(
            f"chat_ctx:emb_unhealthy:{user_id}",
            "1",
            ex=_EMBEDDINGS_UNHEALTHY_TTL_SECONDS,
        )
    except Exception as exc:  # noqa: BLE001
        logger.debug("embeddings-unhealthy mark failed: %s", exc)


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


async def _fetch_recent_assistant_turns(
    ctx: ProviderContext,
    *,
    last_n: int,
    per_turn_chars: int,
) -> List[str]:
    """Pull the last ``last_n`` assistant messages for query expansion.

    Returns plain strings, oldest first. Never raises — on any error
    (missing db session, missing conversation, ORM mismatch) we return
    an empty list so retrieval degrades to the bare user message.
    """
    if last_n <= 0 or not ctx.conversation_id or ctx.db is None:
        return []
    try:
        from sqlalchemy import select

        from app.models.conversation import Message  # local import

        stmt = (
            select(Message.content)
            .where(Message.conversation_id == ctx.conversation_id)
            .where(Message.role == "assistant")
            .order_by(Message.created_at.desc())
            .limit(last_n)
        )
        result = await ctx.db.execute(stmt)
        rows = [row[0] for row in result.all()]
    except Exception as exc:  # noqa: BLE001 - expansion is best-effort
        logger.debug("memory query expansion skipped: %s", exc)
        return []

    # Reverse so we concatenate oldest → newest.
    turns: List[str] = []
    for content in reversed(rows):
        content = (content or "").strip()
        if not content:
            continue
        if len(content) > per_turn_chars:
            content = content[:per_turn_chars].rstrip() + "…"
        turns.append(content)
    return turns


def _expand_query(
    *,
    current: str,
    turns: List[str],
    max_chars: int,
) -> str:
    """Combine the current message with the most recent assistant turns.

    The current message always anchors the query. Prior turns are
    prepended oldest-first so the vector reflects conversation context
    while keeping the live intent last (closer to the embedding tail
    tends to bias more strongly).
    """
    if not turns or max_chars <= 0:
        return current

    pieces: List[str] = list(turns) + [current]
    joined = " | ".join(pieces)
    if len(joined) <= max_chars:
        return joined

    # Truncate the assembled string; drop oldest turns first if still over.
    while len(joined) > max_chars and len(pieces) > 1:
        pieces.pop(0)
        joined = " | ".join(pieces)
    return joined[:max_chars]


async def _load(ctx: ProviderContext) -> ContextResult:
    settings = get_settings()
    cached = await get_section(ctx.user_id, SECTION_NAME, ctx.redis)
    if cached:
        return ContextResult(
            name=SECTION_NAME,
            cached=True,
            parts=cached["parts"],
            tokens=cached["tokens"],
        )

    # Short-lived negative cache: if a previous turn in the last 30s
    # failed at the embeddings layer, skip the embeddings call entirely
    # so we don't burn another per-provider timeout budget on the same
    # outage. The LLM still gets an empty memory section, which is the
    # same outcome but at near-zero cost.
    if await _embeddings_unhealthy(ctx.user_id, ctx.redis):
        return ContextResult(
            name=SECTION_NAME,
            parts=[],
            tokens=0,
            data={"memory_count": 0, "skipped": "embeddings_unhealthy"},
        )

    turns = await _fetch_recent_assistant_turns(
        ctx,
        last_n=settings.MEMORY_QUERY_LAST_TURNS,
        per_turn_chars=settings.MEMORY_QUERY_TURN_CHARS,
    )
    query = _expand_query(
        current=ctx.message,
        turns=turns,
        max_chars=settings.MEMORY_QUERY_MAX_CHARS,
    )

    memories = await retrieve_relevant_memories(
        user_id=ctx.user_id,
        query=query,
        top_k=settings.MEMORY_TOP_K,
        pinecone_index=getattr(ctx, "pinecone_index", None),
        redis=ctx.redis,
        score_floor=settings.MEMORY_SCORE_FLOOR,
        min_keep=settings.MEMORY_MIN_KEEP,
    )

    # If Pinecone returned nothing AND the embeddings path is the only
    # reason (query expansion still succeeded), record a short-lived
    # "embeddings unhealthy" hint. ``retrieve_relevant_memories`` never
    # raises, so the only way we get an empty list is the embeddings
    # call failing or Pinecone returning no matches. We can't
    # distinguish them from here, so only mark unhealthy when we have
    # a non-empty query (otherwise the user just has no memories yet).
    if not memories and query:
        await _mark_embeddings_unhealthy(ctx.user_id, ctx.redis)

    parts, tokens = _format(memories)

    await set_section(
        ctx.user_id,
        SECTION_NAME,
        {"parts": parts, "tokens": tokens, "query": query[:200]},
        ctx.redis,
    )
    return ContextResult(
        name=SECTION_NAME,
        parts=parts,
        tokens=tokens,
        data={"memory_count": len(memories)},
    )


async def build(ctx: ProviderContext) -> ContextResult:
    settings = get_settings()
    return await run_provider(SECTION_NAME, _load, ctx, timeout_ms=settings.CHAT_PROVIDER_TIMEOUT_MS)