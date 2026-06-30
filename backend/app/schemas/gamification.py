"""Pydantic schemas for gamification endpoints."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BadgeOut(BaseModel):
    badge_key: str
    earned_at: datetime

    model_config = {"from_attributes": True}


class GamificationSummary(BaseModel):
    total_xp: int
    level: int
    level_name: str
    xp_to_next: Optional[int]  # None when at max level
    streak: int
    badges: list[BadgeOut]
