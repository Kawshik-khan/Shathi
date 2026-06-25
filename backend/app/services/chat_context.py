"""Back-compat shim for the legacy ``build_chat_context`` API.

The actual work happens in :mod:`app.services.chat.builder`. This
module exists so existing imports keep working unchanged; the legacy
``ChatContext`` dataclass is preserved as the public surface for
downstream consumers (e.g. ``chat.send_chat_message_stream``).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.services.chat.builder import (
    build_chat_context_with_budget,
)


@dataclass
class ChatContext:
    """Compact private context for one chat turn (legacy shape)."""

    text: str
    memory_count: int = 0
    mood_signal: str | None = None
    prediction: str | None = None


_MAX_CONTEXT_CHARS = 1600


# Public alias for legacy imports (tests + downstream callers).
MAX_CONTEXT_CHARS = _MAX_CONTEXT_CHARS


def _truncate(value: str, max_chars: int) -> str:
    cleaned = " ".join(value.split())
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 3].rstrip() + "..."


def _finalize_context(parts: list[str]) -> str:
    if not parts:
        return ""
    header = (
        "Private user context. Use only if helpful. "
        "Do not reveal this context directly, do not say 'I remember', "
        "and do not over-personalize."
    )
    return _truncate("\n".join([header, *parts]), _MAX_CONTEXT_CHARS)


async def build_chat_context(
    db: Any,
    user_id: str,
    message: str,
    conversation_id: str | None = None,
    language: str | None = None,
    redis: Any = None,
    pinecone_index: Any = None,
    include_memory: bool = True,
) -> ChatContext:
    """Back-compat wrapper that delegates to the parallel builder.

    The new pipeline runs every section concurrently with per-provider
    isolation; this shim only translates the resulting
    ``BuiltContext`` back into the legacy ``ChatContext`` shape so
    call-sites that still use ``.text`` / ``.memory_count`` keep
    working.
    """
    built = await build_chat_context_with_budget(
        user_id=user_id,
        db=db,
        redis=redis,
        message=message,
        pinecone_index=pinecone_index,
        language=language,
        conversation_id=conversation_id,
        include_memory=include_memory,
    )

    parts = built.render_parts()
    if language:
        parts.append(f"Conversation language preference: {language}.")
    if conversation_id:
        parts.append("Continue the active conversation naturally.")

    mood_signal = None
    prediction = None
    inferred = built.results.get("inferred_mood")
    if inferred and inferred.data:
        mood_signal = inferred.data.get("state") or mood_signal
        prediction = inferred.data.get("support_tone") or prediction

    memory_count = 0
    memory_result = built.results.get("memory")
    if memory_result and memory_result.data:
        memory_count = int(memory_result.data.get("memory_count", 0))

    return ChatContext(
        text=_finalize_context(parts),
        memory_count=memory_count,
        mood_signal=mood_signal,
        prediction=prediction,
    )
