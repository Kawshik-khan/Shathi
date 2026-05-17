"""Habit tracking service for database operations."""
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, desc, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.habit import Habit, HabitCompletion
from app.schemas.habit import HabitCreate, HabitCompletionCreate, HabitAnalytics


async def create_habit(
    db: AsyncSession, 
    user_id: str, 
    habit_create: HabitCreate
) -> Habit:
    """Create a new habit."""
    # Validate frequency
    valid_frequencies = ["daily", "weekly", "weekdays"]
    if habit_create.frequency not in valid_frequencies:
        raise ValueError(f"Frequency must be one of: {valid_frequencies}")
    
    # Validate target count
    if habit_create.target_count < 1:
        raise ValueError("Target count must be at least 1")
    
    habit = Habit(
        user_id=user_id,
        name=habit_create.name,
        description=habit_create.description,
        icon=habit_create.icon,
        color=habit_create.color,
        frequency=habit_create.frequency,
        target_count=habit_create.target_count,
    )
    
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    
    return habit


async def get_habits(
    db: AsyncSession, 
    user_id: str, 
    active_only: bool = True
) -> List[Habit]:
    """Get habits for a user."""
    query = select(Habit).where(Habit.user_id == user_id)
    
    if active_only:
        query = query.where(Habit.is_active == True)
    
    query = query.order_by(Habit.created_at)
    
    result = await db.execute(query)
    return result.scalars().all()


async def get_habit_by_id(
    db: AsyncSession, 
    user_id: str, 
    habit_id: str
) -> Optional[Habit]:
    """Get a specific habit by ID."""
    result = await db.execute(
        select(Habit)
        .where(
            and_(
                Habit.id == habit_id,
                Habit.user_id == user_id
            )
        )
    )
    return result.scalar_one_or_none()


async def update_habit(
    db: AsyncSession, 
    user_id: str, 
    habit_id: str, 
    update_data: Dict[str, Any]
) -> Optional[Habit]:
    """Update a habit."""
    habit = await get_habit_by_id(db, user_id, habit_id)
    if not habit:
        return None
    
    # Update allowed fields
    allowed_fields = ["name", "description", "icon", "color", "frequency", "target_count", "is_active"]
    
    for field, value in update_data.items():
        if field in allowed_fields and value is not None:
            setattr(habit, field, value)
    
    habit.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(habit)
    
    return habit


async def delete_habit(
    db: AsyncSession, 
    user_id: str, 
    habit_id: str
) -> bool:
    """Delete a habit."""
    habit = await get_habit_by_id(db, user_id, habit_id)
    
    if habit:
        await db.delete(habit)
        await db.commit()
        return True
    
    return False


async def complete_habit(
    db: AsyncSession, 
    user_id: str, 
    habit_id: str, 
    completion_create: HabitCompletionCreate
) -> HabitCompletion:
    """Mark a habit as complete."""
    # Verify habit exists and belongs to user
    habit = await get_habit_by_id(db, user_id, habit_id)
    if not habit:
        raise ValueError("Habit not found")
    
    # Check if already completed for this date
    existing_completion = await get_habit_completion(db, habit_id, completion_create.completed_at)
    if existing_completion:
        # Update existing completion
        existing_completion.count += completion_create.count
        if completion_create.note:
            existing_completion.note = completion_create.note
        await db.commit()
        await db.refresh(existing_completion)
        return existing_completion
    
    # Create new completion
    completion = HabitCompletion(
        habit_id=habit_id,
        completed_at=completion_create.completed_at,
        count=completion_create.count,
        note=completion_create.note,
    )
    
    db.add(completion)
    await db.commit()
    await db.refresh(completion)
    
    # Update habit streaks and totals
    await update_habit_stats(db, habit_id)
    
    return completion


async def get_habit_completion(
    db: AsyncSession, 
    habit_id: str, 
    completion_date: date
) -> Optional[HabitCompletion]:
    """Get habit completion for a specific date."""
    result = await db.execute(
        select(HabitCompletion)
        .where(
            and_(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.completed_at == completion_date
            )
        )
    )
    return result.scalar_one_or_none()


async def get_habit_completions(
    db: AsyncSession, 
    habit_id: str, 
    days: int = 30
) -> List[HabitCompletion]:
    """Get habit completions for the last N days."""
    start_date = date.today() - timedelta(days=days)
    
    result = await db.execute(
        select(HabitCompletion)
        .where(
            and_(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.completed_at >= start_date
            )
        )
        .order_by(desc(HabitCompletion.completed_at))
    )
    return result.scalars().all()


async def update_habit_stats(db: AsyncSession, habit_id: str) -> None:
    """Update habit statistics (streaks, totals)."""
    # Get habit
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    habit = result.scalar_one_or_none()
    if not habit:
        return
    
    # Get all completions for this habit
    completions_result = await db.execute(
        select(HabitCompletion)
        .where(HabitCompletion.habit_id == habit_id)
        .order_by(HabitCompletion.completed_at.desc())
    )
    completions = completions_result.scalars().all()
    
    # Update total completions
    habit.total_completions = len(completions)
    
    # Calculate current streak
    current_streak = await calculate_current_streak(completions, habit.frequency)
    habit.current_streak = current_streak
    
    # Update longest streak if current is longer
    if current_streak > habit.longest_streak:
        habit.longest_streak = current_streak
    
    await db.commit()


async def calculate_current_streak(completions: List[HabitCompletion], frequency: str) -> int:
    """Calculate current streak based on completions and frequency."""
    if not completions:
        return 0
    
    today = date.today()
    streak = 0
    
    # Sort completions by date
    completion_dates = sorted({comp.completed_at for comp in completions}, reverse=True)
    
    for i, completion_date in enumerate(completion_dates):
        expected_date = today - timedelta(days=i)
        
        # For weekdays frequency, skip weekends
        if frequency == "weekdays":
            if expected_date.weekday() >= 5:  # Saturday (5) or Sunday (6)
                continue
        
        # Check if there's a completion for the expected date
        if completion_date == expected_date:
            streak += 1
        else:
            break
    
    return streak


async def get_habit_analytics(
    db: AsyncSession, 
    user_id: str, 
    habit_id: str
) -> HabitAnalytics:
    """Get analytics for a specific habit."""
    habit = await get_habit_by_id(db, user_id, habit_id)
    if not habit:
        raise ValueError("Habit not found")
    
    # Get completions for last 30 days
    thirty_days_ago = date.today() - timedelta(days=30)
    seven_days_ago = date.today() - timedelta(days=7)
    
    # Total completions in periods
    result_30d = await db.execute(
        select(func.count(HabitCompletion.id))
        .where(
            and_(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.completed_at >= thirty_days_ago
            )
        )
    )
    total_30d = result_30d.scalar()
    
    result_7d = await db.execute(
        select(func.count(HabitCompletion.id))
        .where(
            and_(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.completed_at >= seven_days_ago
            )
        )
    )
    total_7d = result_7d.scalar()
    
    # Calculate completion rates
    completion_rate_30d = (total_30d / 30) * 100 if habit.frequency == "daily" else (total_30d / 4) * 100
    completion_rate_7d = (total_7d / 7) * 100 if habit.frequency == "daily" else (total_7d / 1) * 100
    
    # Get weekly data
    weekly_data = await get_weekly_completion_data(db, habit_id)
    
    return HabitAnalytics(
        completion_rate_7d=round(completion_rate_7d, 2),
        completion_rate_30d=round(completion_rate_30d, 2),
        current_streak=habit.current_streak,
        longest_streak=habit.longest_streak,
        weekly_data=weekly_data,
    )


async def get_weekly_completion_data(
    db: AsyncSession, 
    habit_id: str
) -> List[Dict[str, Any]]:
    """Get day-by-day completion data for the last week."""
    today = date.today()
    weekly_data = []
    
    for i in range(7):
        check_date = today - timedelta(days=6 - i)
        
        # Check if completed on this date
        result = await db.execute(
            select(HabitCompletion)
            .where(
                and_(
                    HabitCompletion.habit_id == habit_id,
                    HabitCompletion.completed_at == check_date
                )
            )
        )
        completion = result.scalar_one_or_none()
        
        weekly_data.append({
            "date": check_date.isoformat(),
            "day_name": check_date.strftime("%A"),
            "completed": completion is not None,
            "count": completion.count if completion else 0,
            "note": completion.note if completion else None,
        })
    
    return weekly_data


async def get_all_habits_analytics(
    db: AsyncSession, 
    user_id: str
) -> Dict[str, Any]:
    """Get analytics for all user habits."""
    habits = await get_habits(db, user_id)
    
    total_habits = len(habits)
    active_habits = len([h for h in habits if h.is_active])
    
    # Calculate overall completion rates
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    
    # Get all completions in last 30 days
    result = await db.execute(
        select(func.count(HabitCompletion.id))
        .where(
            and_(
                HabitCompletion.habit_id.in_([h.id for h in habits]),
                HabitCompletion.completed_at >= thirty_days_ago
            )
        )
    )
    total_completions_30d = result.scalar()
    
    # Expected completions based on habit frequencies
    expected_completions = 0
    for habit in habits:
        if habit.frequency == "daily":
            expected_completions += 30
        elif habit.frequency == "weekly":
            expected_completions += 4
        elif habit.frequency == "weekdays":
            expected_completions += 22  # Approximate weekdays in 30 days
    
    overall_completion_rate = (total_completions_30d / expected_completions * 100) if expected_completions > 0 else 0
    
    return {
        "total_habits": total_habits,
        "active_habits": active_habits,
        "overall_completion_rate_30d": round(overall_completion_rate, 2),
        "total_completions_30d": total_completions_30d,
    }

