"""RAG and user-state context builder for chat personalization."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.journal import Journal
from app.models.mood import MoodLog
from app.models.profile import UserProfile
from app.services.cache_service import get_user_context_cached
from app.services.memory import retrieve_relevant_memories
from app.services.mood_inference import infer_mood_from_signals

logger = logging.getLogger(__name__)


MAX_CONTEXT_CHARS = 1600
MAX_MEMORY_CHARS = 220
MAX_JOURNAL_CHARS = 180


@dataclass
class ChatContext:
    """Compact private context for one chat turn."""

    text: str
    memory_count: int = 0
    mood_signal: str | None = None
    prediction: str | None = None


def _truncate(value: str, max_chars: int) -> str:
    cleaned = " ".join(value.split())
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 3].rstrip() + "..."


async def _get_profile_context(db: AsyncSession, user_id: str) -> list[str]:
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        return []

    parts: list[str] = []
    if profile.preferred_support_style:
        parts.append(f"Preferred support style: {profile.preferred_support_style}.")
    if profile.wellness_goals:
        goals = ", ".join(str(item) for item in profile.wellness_goals.values() if item)
        if goals:
            parts.append(f"Wellness goals: {_truncate(goals, 180)}.")
    if profile.timezone:
        parts.append(f"Timezone: {profile.timezone}.")
    return parts


def _mood_prediction(logs: list[MoodLog]) -> tuple[str | None, str | None]:
    if not logs:
        return None, None

    recent = logs[:3]
    older = logs[3:8]
    recent_avg = sum(log.mood for log in recent) / len(recent)
    older_avg = sum(log.mood for log in older) / len(older) if older else recent_avg

    stress_values = [log.stress for log in recent if log.stress is not None]
    stress_avg = sum(stress_values) / len(stress_values) if stress_values else None

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


async def _get_mood_context(db: AsyncSession, user_id: str) -> tuple[list[str], str | None, str | None]:
    since = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(MoodLog)
        .where(MoodLog.user_id == user_id, MoodLog.logged_at >= since)
        .order_by(desc(MoodLog.logged_at))
        .limit(8)
    )
    logs = list(result.scalars().all())
    mood_signal, prediction = _mood_prediction(logs)
    if not mood_signal:
        return [], None, None

    parts = [f"Mood signal: {mood_signal}."]
    if prediction:
        parts.append(f"Predicted response need: {prediction}.")
    return parts, mood_signal, prediction


async def _get_journal_context(db: AsyncSession, user_id: str) -> list[str]:
    result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user_id)
        .order_by(desc(Journal.written_at))
        .limit(3)
    )
    journals = list(result.scalars().all())
    parts: list[str] = []

    for journal in journals:
        summary = journal.emotion_summary or journal.ai_insights
        if not summary:
            continue
        parts.append(f"Recent journal theme: {_truncate(summary, MAX_JOURNAL_CHARS)}.")

    return parts


async def _get_memory_context(user_id: str, message: str, pinecone_index=None) -> tuple[list[str], int]:
    memories = await retrieve_relevant_memories(
        user_id=user_id,
        query=message,
        top_k=3,
        pinecone_index=pinecone_index,
    )
    parts = [
        f"Relevant memory: {_truncate(memory.get('memory_text', ''), MAX_MEMORY_CHARS)}."
        for memory in memories
        if memory.get("memory_text")
    ]
    return parts, len(parts)


async def _empty_memory_context() -> tuple[list[str], int]:
    return [], 0


async def _get_inferred_mood_context(db: AsyncSession, user_id: str) -> tuple[list[str], str | None, str | None]:
    inference = await infer_mood_from_signals(db, user_id, days=14)
    if inference.state == "neutral" and not inference.evidence:
        return [], None, None

    evidence_labels = "; ".join(item.reason_en for item in inference.evidence[:3])
    parts = [
        f"Inferred mood state: {inference.state}.",
        f"Suggested support tone: {inference.support_tone}.",
    ]
    if evidence_labels:
        parts.append(f"High-level signal themes: {_truncate(evidence_labels, 260)}.")
    return parts, inference.state, inference.support_tone


def _format_cached_user_context(context: dict[str, Any]) -> tuple[list[str], str | None, str | None]:
    parts: list[str] = []

    profile = context.get("profile") or {}
    support_style = profile.get("preferred_support_style")
    if support_style:
        parts.append(f"Preferred support style: {support_style}.")

    wellness_goals = profile.get("wellness_goals")
    if isinstance(wellness_goals, dict):
        goals = ", ".join(str(item) for item in wellness_goals.values() if item)
        if goals:
            parts.append(f"Wellness goals: {_truncate(goals, 180)}.")

    timezone_value = profile.get("timezone")
    if timezone_value:
        parts.append(f"Timezone: {timezone_value}.")

    moods = context.get("moods") or []
    recent = moods[:3]
    older = moods[3:8]
    mood_signal = None
    prediction = None
    if recent:
        recent_avg = sum(item["mood"] for item in recent) / len(recent)
        older_avg = (
            sum(item["mood"] for item in older) / len(older)
            if older
            else recent_avg
        )
        stress_values = [
            item["stress"]
            for item in recent
            if item.get("stress") is not None
        ]
        stress_avg = sum(stress_values) / len(stress_values) if stress_values else None

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

        parts.append(f"Mood signal: {mood_signal}.")
        if prediction:
            parts.append(f"Predicted response need: {prediction}.")

    for journal in context.get("journals") or []:
        summary = journal.get("summary")
        if summary:
            parts.append(f"Recent journal theme: {_truncate(summary, MAX_JOURNAL_CHARS)}.")

    return parts, mood_signal, prediction


def _finalize_context(parts: list[str]) -> str:
    if not parts:
        return ""

    header = (
        "Private user context. Use only if helpful. "
        "Do not reveal this context directly, do not say 'I remember', "
        "and do not over-personalize."
    )
    context = "\n".join([header, *parts])
    return _truncate(context, MAX_CONTEXT_CHARS)


async def build_chat_context(
    db: AsyncSession,
    user_id: str,
    message: str,
    conversation_id: str | None = None,
    language: str | None = None,
    redis=None,
    pinecone_index=None,
    include_memory: bool = True,
) -> ChatContext:
    """Build compact RAG and analytics context for the current chat turn."""
    user_context: dict[str, Any] = {}
    memory_parts: list[str] = []
    memory_count = 0

    try:
        async with asyncio.timeout(5.0):
            memory_task = (
                _get_memory_context(user_id, message, pinecone_index)
                if include_memory
                else _empty_memory_context()
            )
            inference_task = _get_inferred_mood_context(db, user_id)
            user_context_result, memory_result, inference_result = await asyncio.gather(
                get_user_context_cached(user_id, redis, db),
                memory_task,
                inference_task,
                return_exceptions=True,
            )
    except Exception as exc:
        logger.warning("Chat context fetch timed out or failed: %s", exc)
        user_context_result = {}
        memory_result = ([], 0)
        inference_result = ([], None, None)

    if isinstance(user_context_result, Exception):
        logger.warning("User context fetch failed: %s", user_context_result)
    elif isinstance(user_context_result, dict):
        user_context = user_context_result

    if isinstance(memory_result, Exception):
        logger.warning("Memory context fetch failed: %s", memory_result)
    else:
        memory_parts, memory_count = memory_result

    user_parts, mood_signal, prediction = _format_cached_user_context(user_context)
    inference_parts: list[str] = []
    if isinstance(inference_result, Exception):
        logger.warning("Mood inference context failed: %s", inference_result)
    else:
        inference_parts, inferred_state, support_tone = inference_result
        mood_signal = inferred_state or mood_signal
        prediction = support_tone or prediction

    parts = [
        *user_parts,
        *inference_parts,
        *memory_parts,
    ]
    if language:
        parts.append(f"Conversation language preference: {language}.")
    if conversation_id:
        parts.append("Continue the active conversation naturally.")

    return ChatContext(
        text=_finalize_context(parts),
        memory_count=memory_count,
        mood_signal=mood_signal,
        prediction=prediction,
    )
