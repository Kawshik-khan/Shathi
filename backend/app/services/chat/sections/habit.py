"""Habit section provider.

Active habits + recent completions summarized as a streak/count line.
Uses the ``idx_habit_completions_habit_completed_desc`` index.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.habit import Habit, HabitCompletion
from app.services.chat.cache import get_section, set_section
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)

logger = logging.getLogger(__name__)

SECTION_NAME = "habit"


def _format(
    habits: list[Habit], completions: list[HabitCompletion]
) -> tuple[list[str], int]:
    parts: list[str] = []
    if not habits:
        return parts, 0

    active = [habit for habit in habits if habit.is_active]
    parts.append(
        f"Habits: {len(active)} active of {len(habits)} total; "
        f"recent completions: {len(completions)}."
    )

    today = date.today()
    recent_days = {today - timedelta(days=offset) for offset in range(7)}
    recent_completions = [
        completion for completion in completions if completion.completed_at in recent_days
    ]
    parts.append(f"Completions in last 7 days: {len(recent_completions)}.")

    top_streak = max(
        (habit.current_streak for habit in active),
        default=0,
    )
    if top_streak:
        parts.append(f"Top current streak: {top_streak} days.")
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
    habits_result = await db.execute(
        select(Habit).where(Habit.user_id == ctx.user_id)
    )
    habits = list(habits_result.scalars().all())
    completions: list[HabitCompletion] = []
    if habits:
        since = date.today() - timedelta(days=30)
        completions_result = await db.execute(
            select(HabitCompletion)
            .where(
                HabitCompletion.habit_id.in_([habit.id for habit in habits]),
                HabitCompletion.completed_at >= since,
            )
            .order_by(desc(HabitCompletion.completed_at))
            .limit(60)
        )
        completions = list(completions_result.scalars().all())

    parts, tokens = _format(habits, completions)
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