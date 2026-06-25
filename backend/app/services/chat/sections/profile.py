"""Profile section provider.

Loads ``UserProfile`` (support style, wellness goals, timezone) and
formats a compact prompt fragment. The result is cache-friendly since
profile data changes infrequently.
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.profile import UserProfile
from app.services.chat.cache import get_section, set_section
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)

logger = logging.getLogger(__name__)

SECTION_NAME = "profile"


def _format(profile: UserProfile | None) -> tuple[list[str], int]:
    parts: list[str] = []
    if profile is None:
        return parts, 0

    support_style = profile.preferred_support_style or "supportive_listener"
    timezone = profile.timezone or "Asia/Dhaka"
    parts.append(
        f"User profile: timezone={timezone}, preferred_support_style={support_style}."
    )

    goals = profile.wellness_goals or {}
    if isinstance(goals, dict) and goals:
        items = ", ".join(f"{key}={value}" for key, value in list(goals.items())[:6])
        parts.append(f"Wellness goals: {items}.")

    if profile.bio:
        bio = profile.bio.strip()
        if bio:
            parts.append(f"User bio: {bio[:200]}")
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
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == ctx.user_id)
    )
    profile = result.scalar_one_or_none()
    parts, tokens = _format(profile)

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
