"""Habits API routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.habit import (
    Habit as HabitSchema, 
    HabitCreate, 
    HabitCompletion as HabitCompletionSchema, 
    HabitCompletionCreate,
    HabitAnalytics
)
from app.services.habit import (
    create_habit as create_habit_service,
    get_habits,
    get_habit_by_id,
    update_habit,
    delete_habit,
    complete_habit as complete_habit_service,
    get_habit_analytics,
    get_habit_completions
)
from app.models.user import User
from app.models.habit import Habit as HabitModel, HabitCompletion as HabitCompletionModel

router = APIRouter()


@router.post("/", response_model=HabitSchema, status_code=status.HTTP_201_CREATED)
async def create_habit_endpoint(
    habit: HabitCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HabitSchema:
    """Create a new habit."""
    try:
        new_habit = await create_habit_service(db, current_user.id, habit)
        
        return HabitSchema(
            id=new_habit.id,
            user_id=new_habit.user_id,
            name=new_habit.name,
            description=new_habit.description,
            icon=new_habit.icon,
            color=new_habit.color,
            frequency=new_habit.frequency,
            target_count=new_habit.target_count,
            current_streak=new_habit.current_streak,
            longest_streak=new_habit.longest_streak,
            total_completions=new_habit.total_completions,
            is_active=new_habit.is_active,
            created_at=new_habit.created_at,
            updated_at=new_habit.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create habit"
        )


@router.get("/", response_model=List[HabitSchema])
async def list_habits(
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[HabitSchema]:
    """List all habits for the current user."""
    habits = await get_habits(db, current_user.id, active_only)
    
    return [
        HabitSchema(
            id=habit.id,
            user_id=habit.user_id,
            name=habit.name,
            description=habit.description,
            icon=habit.icon,
            color=habit.color,
            frequency=habit.frequency,
            target_count=habit.target_count,
            current_streak=habit.current_streak,
            longest_streak=habit.longest_streak,
            total_completions=habit.total_completions,
            is_active=habit.is_active,
            created_at=habit.created_at,
            updated_at=habit.updated_at,
        )
        for habit in habits
    ]


@router.get("/{habit_id}", response_model=HabitSchema)
async def get_habit(
    habit_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HabitSchema:
    """Get a specific habit."""
    habit = await get_habit_by_id(db, current_user.id, habit_id)
    
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    return HabitSchema(
        id=habit.id,
        user_id=habit.user_id,
        name=habit.name,
        description=habit.description,
        icon=habit.icon,
        color=habit.color,
        frequency=habit.frequency,
        target_count=habit.target_count,
        current_streak=habit.current_streak,
        longest_streak=habit.longest_streak,
        total_completions=habit.total_completions,
        is_active=habit.is_active,
        created_at=habit.created_at,
        updated_at=habit.updated_at,
    )


@router.put("/{habit_id}", response_model=HabitSchema)
async def update_habit_endpoint(
    habit_id: str,
    update_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HabitSchema:
    """Update a habit."""
    updated_habit = await update_habit(db, current_user.id, habit_id, update_data)
    
    if not updated_habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    return HabitSchema(
        id=updated_habit.id,
        user_id=updated_habit.user_id,
        name=updated_habit.name,
        description=updated_habit.description,
        icon=updated_habit.icon,
        color=updated_habit.color,
        frequency=updated_habit.frequency,
        target_count=updated_habit.target_count,
        current_streak=updated_habit.current_streak,
        longest_streak=updated_habit.longest_streak,
        total_completions=updated_habit.total_completions,
        is_active=updated_habit.is_active,
        created_at=updated_habit.created_at,
        updated_at=updated_habit.updated_at,
    )


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit_endpoint(
    habit_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a habit."""
    success = await delete_habit(db, current_user.id, habit_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )


@router.post("/{habit_id}/complete", response_model=HabitCompletionSchema)
async def complete_habit(
    habit_id: str,
    completion: HabitCompletionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HabitCompletionSchema:
    """Mark a habit as complete."""
    try:
        # Verify habit exists
        habit = await get_habit_by_id(db, current_user.id, habit_id)
        if not habit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Habit not found"
            )
        
        completion_record = await complete_habit_service(db, current_user.id, habit_id, completion)
        
        return HabitCompletionSchema(
            id=completion_record.id,
            habit_id=completion_record.habit_id,
            completed_at=completion_record.completed_at,
            count=completion_record.count,
            note=completion_record.note,
            ai_feedback=completion_record.ai_feedback,
            created_at=completion_record.created_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete habit"
        )


@router.get("/{habit_id}/completions", response_model=List[HabitCompletionSchema])
async def get_habit_completions_endpoint(
    habit_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[HabitCompletionSchema]:
    """Get completions for a specific habit."""
    # Verify habit exists
    habit = await get_habit_by_id(db, current_user.id, habit_id)
    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit not found"
        )
    
    completions = await get_habit_completions(db, habit_id, days)
    
    return [
        HabitCompletionSchema(
            id=completion.id,
            habit_id=completion.habit_id,
            completed_at=completion.completed_at,
            count=completion.count,
            note=completion.note,
            ai_feedback=completion.ai_feedback,
            created_at=completion.created_at,
        )
        for completion in completions
    ]


@router.get("/{habit_id}/analytics", response_model=HabitAnalytics)
async def get_habit_analytics_endpoint(
    habit_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HabitAnalytics:
    """Get analytics for a specific habit."""
    try:
        return await get_habit_analytics(db, current_user.id, habit_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

