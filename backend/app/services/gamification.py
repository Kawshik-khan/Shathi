"""Gamification service: XP awards, badge evaluation, and summary."""
from datetime import datetime, timezone, date
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gamification import UserXP, UserBadge
from app.models.mood import MoodLog
from app.models.journal import Journal
from app.models.habit import HabitCompletion
from app.schemas.gamification import BadgeOut, GamificationSummary

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

XP_TABLE: dict[str, int] = {
    "mood_log": 10,
    "journal": 15,
    "sleep_log": 10,
    "habit_completion": 12,
    "ai_chat": 8,
}

LEVELS = [
    (1, "Seedling", 0),
    (2, "Sprout", 100),
    (3, "Bloom", 300),
    (4, "Flourish", 700),
    (5, "Radiant", 1500),
]

BADGE_CATALOG = [
    "first_mood",
    "first_journal",
    "first_sleep",
    "first_habit",
    "streak_3",
    "streak_7",
    "streak_30",
    "journal_10",
    "habit_50",
    "level_bloom",
    "level_radiant",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _compute_level(total_xp: int) -> tuple[int, str, Optional[int]]:
    """Return (level_number, level_name, xp_to_next). xp_to_next is None at max."""
    current_level, current_name = LEVELS[0][0], LEVELS[0][1]
    for level_num, name, threshold in LEVELS:
        if total_xp >= threshold:
            current_level, current_name = level_num, name
        else:
            break
    # xp_to_next
    next_thresholds = [t for _, _, t in LEVELS if t > total_xp]
    xp_to_next = next_thresholds[0] - total_xp if next_thresholds else None
    return current_level, current_name, xp_to_next


async def _count_login_streak(db: AsyncSession, user_id: str) -> int:
    """Compute consecutive-day streak from XP events (any action counts as a login)."""
    result = await db.execute(
        select(UserXP.awarded_date)
        .where(UserXP.user_id == user_id)
        .distinct()
        .order_by(UserXP.awarded_date.desc())
    )
    dates = [row[0] for row in result.fetchall()]
    if not dates:
        return 0
    streak = 1
    today = date.today()
    # Allow today or yesterday as the most recent active day
    if dates[0] < today and (today - dates[0]).days > 1:
        return 0
    for i in range(1, len(dates)):
        if (dates[i - 1] - dates[i]).days == 1:
            streak += 1
        else:
            break
    return streak


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def award_xp(db: AsyncSession, user_id: str, action_type: str) -> Optional[UserXP]:
    """Award XP for an action. Idempotent: one award per (user, action, day)."""
    xp = XP_TABLE.get(action_type)
    if xp is None:
        return None
    today = date.today()
    event = UserXP(
        user_id=user_id,
        action_type=action_type,
        xp_awarded=xp,
        awarded_date=today,
    )
    db.add(event)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        return None
    return event


async def evaluate_badges(db: AsyncSession, user_id: str) -> list[str]:
    """Check all badge conditions and insert newly earned badges. Returns new badge keys."""
    # Fetch already-earned badges
    result = await db.execute(
        select(UserBadge.badge_key).where(UserBadge.user_id == user_id)
    )
    earned: set[str] = {row[0] for row in result.fetchall()}

    new_badges: list[str] = []

    async def _grant(key: str) -> None:
        if key not in earned:
            db.add(UserBadge(user_id=user_id, badge_key=key))
            try:
                await db.flush()
                new_badges.append(key)
                earned.add(key)
            except IntegrityError:
                await db.rollback()

    # --- first_mood
    mood_count_result = await db.execute(
        select(func.count()).select_from(MoodLog).where(MoodLog.user_id == user_id)
    )
    mood_count = mood_count_result.scalar() or 0
    if mood_count >= 1:
        await _grant("first_mood")

    # --- first_journal
    journal_count_result = await db.execute(
        select(func.count()).select_from(Journal).where(Journal.user_id == user_id)
    )
    journal_count = journal_count_result.scalar() or 0
    if journal_count >= 1:
        await _grant("first_journal")
    if journal_count >= 10:
        await _grant("journal_10")

    # --- first_sleep (XP event)
    sleep_count_result = await db.execute(
        select(func.count()).select_from(UserXP).where(
            UserXP.user_id == user_id, UserXP.action_type == "sleep_log"
        )
    )
    sleep_count = sleep_count_result.scalar() or 0
    if sleep_count >= 1:
        await _grant("first_sleep")

    # --- first_habit / habit_50
    habit_count_result = await db.execute(
        select(func.count()).select_from(HabitCompletion).join(
            HabitCompletion.habit
        ).where(HabitCompletion.habit.has(user_id=user_id))
    )
    habit_count = habit_count_result.scalar() or 0
    if habit_count >= 1:
        await _grant("first_habit")
    if habit_count >= 50:
        await _grant("habit_50")

    # --- streak badges
    streak = await _count_login_streak(db, user_id)
    if streak >= 3:
        await _grant("streak_3")
    if streak >= 7:
        await _grant("streak_7")
    if streak >= 30:
        await _grant("streak_30")

    # --- level badges
    xp_total_result = await db.execute(
        select(func.sum(UserXP.xp_awarded)).where(UserXP.user_id == user_id)
    )
    total_xp = xp_total_result.scalar() or 0
    level, _, _ = _compute_level(total_xp)
    if level >= 3:
        await _grant("level_bloom")
    if level >= 5:
        await _grant("level_radiant")

    return new_badges


async def get_gamification_summary(db: AsyncSession, user_id: str) -> GamificationSummary:
    """Return full gamification summary for a user."""
    # Total XP
    xp_result = await db.execute(
        select(func.sum(UserXP.xp_awarded)).where(UserXP.user_id == user_id)
    )
    total_xp: int = xp_result.scalar() or 0

    level, level_name, xp_to_next = _compute_level(total_xp)
    streak = await _count_login_streak(db, user_id)

    # Evaluate badges lazily
    await evaluate_badges(db, user_id)
    await db.commit()

    badges_result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == user_id).order_by(UserBadge.earned_at)
    )
    badges = [
        BadgeOut(badge_key=b.badge_key, earned_at=b.earned_at)
        for b in badges_result.scalars().all()
    ]

    return GamificationSummary(
        total_xp=total_xp,
        level=level,
        level_name=level_name,
        xp_to_next=xp_to_next,
        streak=streak,
        badges=badges,
    )
