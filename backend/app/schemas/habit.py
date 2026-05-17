"""Habit tracking schemas."""
from datetime import date
from typing import Optional, List, Dict

from app.schemas.base import BaseSchema, TimestampedSchema


class HabitBase(BaseSchema):
    """Base habit schema."""
    
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    frequency: str = "daily"  # daily, weekly, weekdays
    target_count: int = 1


class HabitCreate(HabitBase):
    """Schema for creating a habit."""
    
    pass


class Habit(HabitBase, TimestampedSchema):
    """Full habit schema."""
    
    id: str
    user_id: str
    current_streak: int
    longest_streak: int
    total_completions: int
    is_active: bool


class HabitCompletionBase(BaseSchema):
    """Base habit completion schema."""
    
    completed_at: date
    count: int = 1
    note: Optional[str] = None


class HabitCompletionCreate(HabitCompletionBase):
    """Schema for creating a habit completion."""
    
    pass


class HabitCompletion(HabitCompletionBase, TimestampedSchema):
    """Full habit completion schema."""
    
    id: str
    habit_id: str
    ai_feedback: Optional[str] = None


class HabitAnalytics(BaseSchema):
    """Habit analytics response."""
    
    completion_rate_7d: float
    completion_rate_30d: float
    current_streak: int
    longest_streak: int
    weekly_data: List[Dict]  # Day-by-day completion status

