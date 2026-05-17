"""Journal API routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.journal import Journal as JournalSchema, JournalCreate, JournalUpdate
from app.services.journal import (
    create_journal_entry, 
    get_journal_entries, 
    get_journal_entry_by_id,
    update_journal_entry, 
    delete_journal_entry
)
from app.models.user import User
from app.models.journal import Journal as JournalModel

router = APIRouter()


@router.post("/entries", response_model=JournalSchema, status_code=status.HTTP_201_CREATED)
async def create_journal_entry(
    entry: JournalCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> JournalSchema:
    """Create a new journal entry."""
    try:
        journal_entry = await create_journal_entry(db, current_user.id, entry)
        
        return JournalSchema(
            id=journal_entry.id,
            user_id=journal_entry.user_id,
            title=journal_entry.title,
            content=journal_entry.content,
            emotion_summary=journal_entry.emotion_summary,
            emotion_tags=journal_entry.emotion_tags.split(",") if journal_entry.emotion_tags else [],
            sentiment_score=journal_entry.sentiment_score,
            ai_insights=journal_entry.ai_insights,
            word_count=journal_entry.word_count,
            reading_time_minutes=journal_entry.reading_time_minutes,
            written_at=journal_entry.written_at,
            created_at=journal_entry.created_at,
            updated_at=journal_entry.updated_at,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create journal entry"
        )


@router.get("/entries", response_model=List[JournalSchema])
async def list_journal_entries(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[JournalSchema]:
    """List journal entries for the current user."""
    journal_entries = await get_journal_entries(db, current_user.id, limit, offset)
    
    return [
        JournalSchema(
            id=entry.id,
            user_id=entry.user_id,
            title=entry.title,
            content=entry.content,
            emotion_summary=entry.emotion_summary,
            emotion_tags=entry.emotion_tags.split(",") if entry.emotion_tags else [],
            sentiment_score=entry.sentiment_score,
            ai_insights=entry.ai_insights,
            word_count=entry.word_count,
            reading_time_minutes=entry.reading_time_minutes,
            written_at=entry.written_at,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
        )
        for entry in journal_entries
    ]


@router.get("/entries/{entry_id}", response_model=JournalSchema)
async def get_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> JournalSchema:
    """Get a specific journal entry."""
    journal_entry = await get_journal_entry_by_id(db, current_user.id, entry_id)
    
    if not journal_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    
    return JournalSchema(
        id=journal_entry.id,
        user_id=journal_entry.user_id,
        title=journal_entry.title,
        content=journal_entry.content,
        emotion_summary=journal_entry.emotion_summary,
        emotion_tags=journal_entry.emotion_tags.split(",") if journal_entry.emotion_tags else [],
        sentiment_score=journal_entry.sentiment_score,
        ai_insights=journal_entry.ai_insights,
        word_count=journal_entry.word_count,
        reading_time_minutes=journal_entry.reading_time_minutes,
        written_at=journal_entry.written_at,
        created_at=journal_entry.created_at,
        updated_at=journal_entry.updated_at,
    )


@router.put("/entries/{entry_id}", response_model=JournalSchema)
async def update_journal_entry(
    entry_id: str,
    update: JournalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> JournalSchema:
    """Update a journal entry."""
    updated_entry = await update_journal_entry(db, current_user.id, entry_id, update)
    
    if not updated_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    
    return JournalSchema(
        id=updated_entry.id,
        user_id=updated_entry.user_id,
        title=updated_entry.title,
        content=updated_entry.content,
        emotion_summary=updated_entry.emotion_summary,
        emotion_tags=updated_entry.emotion_tags.split(",") if updated_entry.emotion_tags else [],
        sentiment_score=updated_entry.sentiment_score,
        ai_insights=updated_entry.ai_insights,
        word_count=updated_entry.word_count,
        reading_time_minutes=updated_entry.reading_time_minutes,
        written_at=updated_entry.written_at,
        created_at=updated_entry.created_at,
        updated_at=updated_entry.updated_at,
    )


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a journal entry."""
    success = await delete_journal_entry(db, current_user.id, entry_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")

