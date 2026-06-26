"""Back-compat shim for the legacy ``build_chat_context`` API.

The actual work happens in :mod:`app.services.chat.builder`. This
module exists so existing imports keep working unchanged; the legacy
``ChatContext`` dataclass is preserved as the public surface for
downstream consumers (e.g. ``chat.send_chat_message_stream``).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from app.services.chat.builder import (
    build_chat_context_with_budget,
)

if TYPE_CHECKING:  # pragma: no cover - only for type hints
    from app.models.mood import MoodLog


@dataclass
class ChatContext:
    """Compact private context for one chat turn (legacy shape)."""

    text: str
    memory_count: int = 0
    mood_signal: str | None = None
    prediction: str | None = None
    # RAG visibility flags. ``rag_used`` is true whenever the memory
    # section actually returned at least one Pinecone hit; ``memory_status``
    # mirrors the section status ("ok" | "timeout" | "error" | "empty")
    # so the streaming SSE can surface RAG state to the client.
    rag_used: bool = False
    memory_status: str | None = None


_MAX_CONTEXT_CHARS = 1600


# Public alias for legacy imports (tests + downstream callers).
MAX_CONTEXT_CHARS = _MAX_CONTEXT_CHARS


def _mood_prediction(logs):
    """Derive a coarse mood signal + reply-tone prediction from logs.

    Preserved from the pre-refactor implementation so existing tests
    and downstream consumers keep working unchanged.
    """
    if not logs:
        return None, None

    recent = logs[:3]
    older = logs[3:8]
    recent_avg = sum(log.mood for log in recent) / len(recent)
    older_avg = (
        sum(log.mood for log in older) / len(older) if older else recent_avg
    )

    stress_values = [log.stress for log in recent if log.stress is not None]
    stress_avg = (
        sum(stress_values) / len(stress_values) if stress_values else None
    )

    if recent_avg <= 4 or recent_avg < older_avg - 1:
        mood_signal = "recent mood is low or trending down"
        prediction = "needs gentle support"
    elif recent_avg >= 7 and recent_avg > older_avg:
        mood_signal = "recent mood is positive or improving"
        prediction = "can use upbeat energy"
    else:
        mood_signal = "recent mood is stable"
        prediction = "use normal casual tone"

    if stress_avg is not None and stress_avg >= 7:
        mood_signal = f"{mood_signal}; recent stress is high"
        prediction = "may be stressed, keep reply calm and practical"

    return mood_signal, prediction


def _truncate(value: str, max_chars: int) -> str:
    cleaned = " ".join(value.split())
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 3].rstrip() + "..."


def _finalize_context(parts):
    if not parts:
        return ""
    header = (
        "Private user context. Use only if helpful. "
        "Do not reveal this context directly, do not say 'I remember', "
        "and do not over-personalize."
    )
    return _truncate("\n".join([header, *parts]), _MAX_CONTEXT_CHARS)


async def build_chat_context(
    db,
    user_id,
    message,
    conversation_id=None,
    language=None,
    redis=None,
    pinecone_index=None,
    include_memory=True,
):
    """Back-compat wrapper that delegates to the parallel builder."""
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
    memory_status: str | None = None
    rag_used = False
    memory_result = built.results.get("memory")
    if memory_result and memory_result.data:
        memory_count = int(memory_result.data.get("memory_count", 0))
    if memory_result is not None:
        # ``status`` is one of "ok" | "timeout" | "error" | "empty" — we
        # forward it so the streaming SSE can render a "memory: timed
        # out" or "memory: ok (3 hits)" hint when useful.
        memory_status = memory_result.status
        rag_used = memory_count > 0 and memory_result.status == "ok"

    return ChatContext(
        text=_finalize_context(parts),
        memory_count=memory_count,
        mood_signal=mood_signal,
        prediction=prediction,
        rag_used=rag_used,
        memory_status=memory_status,
    )