"""Per-section Redis cache for chat context providers.

Each context section (profile, mood, journal, sleep, habit, activity,
memory, inferred_mood) has its own Redis key with a configurable TTL.
Sections are independent: a write to journals only invalidates the
journal key, etc.

Failure semantics:
* Redis unavailable  -> every function is a no-op, never raises.
* Malformed cache hit -> logged warning, treated as miss.
* Cache write fails -> logged warning, request continues.

The bulk ``invalidate_user_context_sections`` helper removes a named
subset of keys for a user in one round-trip. Write routes call it
with the specific sections they affect.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Iterable, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)


# TTL lookup by section name. Falls back to USER_CONTEXT_CACHE_TTL.
_SECTION_TTL_ATTRS = {
    "profile": "CHAT_CACHE_TTL_PROFILE",
    "mood": "CHAT_CACHE_TTL_MOOD",
    "journal": "CHAT_CACHE_TTL_JOURNAL",
    "sleep": "CHAT_CACHE_TTL_SLEEP",
    "habit": "CHAT_CACHE_TTL_HABIT",
    "activity": "CHAT_CACHE_TTL_ACTIVITY",
    "memory": "CHAT_CACHE_TTL_MEMORY",
    "inferred_mood": "CHAT_CACHE_TTL_INFERRED",
}


def _section_key(user_id: str, section: str) -> str:
    return f"chat_ctx:{section}:{user_id}"


def _ttl_for(section: str) -> int:
    settings = get_settings()
    attr = _SECTION_TTL_ATTRS.get(section)
    if attr and hasattr(settings, attr):
        return int(getattr(settings, attr))
    return int(settings.USER_CONTEXT_CACHE_TTL)


async def get_section(
    user_id: str,
    section: str,
    redis: Any,
) -> Optional[dict[str, Any]]:
    """Return cached payload for a section, or None on miss/error."""
    if redis is None:
        return None
    try:
        raw = await redis.get(_section_key(user_id, section))
    except Exception as exc:  # noqa: BLE001 - cache must never raise
        logger.warning("chat_cache get %s failed: %s", section, exc)
        return None
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (TypeError, ValueError) as exc:
        logger.warning("chat_cache get %s decode failed: %s", section, exc)
        return None


async def set_section(
    user_id: str,
    section: str,
    payload: dict[str, Any],
    redis: Any,
    *,
    ttl: Optional[int] = None,
) -> None:
    """Cache a section payload with its section-specific TTL."""
    if redis is None:
        return
    try:
        await redis.set(
            _section_key(user_id, section),
            json.dumps(payload, default=str),
            ex=ttl if ttl is not None else _ttl_for(section),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("chat_cache set %s failed: %s", section, exc)


async def invalidate_user_context_sections(
    user_id: str,
    redis: Any,
    sections: Optional[Iterable[str]] = None,
) -> None:
    """Invalidate one or many sections for a user.

    ``sections=None`` invalidates every known section — used when the
    user profile itself changes (the safest blast radius). Write
    endpoints prefer to pass only the section they touched.
    """
    if redis is None:
        return

    target_sections = list(sections) if sections is not None else list(_SECTION_TTL_ATTRS.keys())
    if not target_sections:
        return

    # Use UNLINK when available (non-blocking), fall back to DELETE.
    keys = [_section_key(user_id, section) for section in target_sections]
    try:
        deleter = getattr(redis, "unlink", None) or getattr(redis, "delete", None)
        if deleter is None:
            return
        result = deleter(*keys)
        if asyncio_iscoroutine(result):
            await result
    except Exception as exc:  # noqa: BLE001
        logger.warning("chat_cache invalidate failed: %s", exc)


def asyncio_iscoroutine(value: Any) -> bool:
    import asyncio

    return asyncio.iscoroutine(value)


# Legacy alias kept so existing callers (cache_service._cache_key consumers)
# do not break when migrating.
def legacy_user_context_key(user_id: str) -> str:
    return f"user_context:{user_id}"