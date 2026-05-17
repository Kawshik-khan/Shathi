"""Journal service for database operations."""
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.journal import Journal
from app.schemas.journal import JournalCreate, JournalUpdate
from app.services.emotion import detect_emotion


async def create_journal_entry(
    db: AsyncSession, 
    user_id: str, 
    journal_create: JournalCreate
) -> Journal:
    """Create a new journal entry with AI analysis."""
    # Calculate word count and reading time
    word_count = len(journal_create.content.split())
    reading_time_minutes = max(1, word_count // 200)  # Assuming 200 words per minute
    
    # Perform AI analysis on content
    emotion_summary = None
    emotion_tags = []
    sentiment_score = None
    ai_insights = None
    
    try:
        # Detect emotion from content
        emotion_result = await detect_emotion(journal_create.content)
        emotion_summary = f"Primary emotion: {emotion_result.emotion}"
        emotion_tags = [emotion_result.emotion]
        sentiment_score = emotion_result.confidence
        
        # Generate AI insights (placeholder - could be enhanced with more sophisticated analysis)
        if word_count > 50:
            ai_insights = f"This entry shows {emotion_result.emotion} with {word_count} words expressing personal thoughts."
        
    except Exception:
        # If AI analysis fails, continue without it
        pass
    
    # Create journal entry
    journal_entry = Journal(
        user_id=user_id,
        title=journal_create.title,
        content=journal_create.content,
        emotion_summary=emotion_summary,
        emotion_tags=",".join(emotion_tags) if emotion_tags else None,
        sentiment_score=sentiment_score,
        ai_insights=ai_insights,
        word_count=word_count,
        reading_time_minutes=reading_time_minutes,
        written_at=journal_create.written_at or datetime.now(timezone.utc),
    )
    
    db.add(journal_entry)
    await db.commit()
    await db.refresh(journal_entry)
    
    return journal_entry


async def get_journal_entries(
    db: AsyncSession, 
    user_id: str, 
    limit: int = 20,
    offset: int = 0
) -> List[Journal]:
    """Get journal entries for a user with pagination."""
    result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user_id)
        .order_by(desc(Journal.written_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_journal_entry_by_id(
    db: AsyncSession, 
    user_id: str, 
    entry_id: str
) -> Optional[Journal]:
    """Get a specific journal entry by ID."""
    result = await db.execute(
        select(Journal)
        .where(
            and_(
                Journal.id == entry_id,
                Journal.user_id == user_id
            )
        )
    )
    return result.scalar_one_or_none()


async def update_journal_entry(
    db: AsyncSession, 
    user_id: str, 
    entry_id: str, 
    journal_update: JournalUpdate
) -> Optional[Journal]:
    """Update a journal entry."""
    # Get the existing entry
    journal_entry = await get_journal_entry_by_id(db, user_id, entry_id)
    if not journal_entry:
        return None
    
    # Update fields if provided
    if journal_update.title is not None:
        journal_entry.title = journal_update.title
    
    if journal_update.content is not None:
        journal_entry.content = journal_update.content
        
        # Recalculate word count and reading time
        word_count = len(journal_update.content.split())
        reading_time_minutes = max(1, word_count // 200)
        journal_entry.word_count = word_count
        journal_entry.reading_time_minutes = reading_time_minutes
        
        # Re-run AI analysis on new content
        try:
            emotion_result = await detect_emotion(journal_update.content)
            journal_entry.emotion_summary = f"Primary emotion: {emotion_result.emotion}"
            journal_entry.emotion_tags = emotion_result.emotion
            journal_entry.sentiment_score = emotion_result.confidence
            
            if word_count > 50:
                ai_insights = f"Updated entry shows {emotion_result.emotion} with {word_count} words expressing personal thoughts."
                journal_entry.ai_insights = ai_insights
                
        except Exception:
            # If AI analysis fails, keep existing values
            pass
    
    # Update timestamp
    journal_entry.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(journal_entry)
    
    return journal_entry


async def delete_journal_entry(
    db: AsyncSession, 
    user_id: str, 
    entry_id: str
) -> bool:
    """Delete a journal entry."""
    journal_entry = await get_journal_entry_by_id(db, user_id, entry_id)
    
    if journal_entry:
        await db.delete(journal_entry)
        await db.commit()
        return True
    
    return False


async def search_journal_entries(
    db: AsyncSession, 
    user_id: str, 
    query: str, 
    limit: int = 20,
    offset: int = 0
) -> List[Journal]:
    """Search journal entries by content."""
    result = await db.execute(
        select(Journal)
        .where(
            and_(
                Journal.user_id == user_id,
                Journal.content.ilike(f"%{query}%")
            )
        )
        .order_by(desc(Journal.written_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_journal_entries_by_emotion(
    db: AsyncSession, 
    user_id: str, 
    emotion: str, 
    limit: int = 20,
    offset: int = 0
) -> List[Journal]:
    """Get journal entries filtered by emotion tag."""
    result = await db.execute(
        select(Journal)
        .where(
            and_(
                Journal.user_id == user_id,
                Journal.emotion_tags.ilike(f"%{emotion}%")
            )
        )
        .order_by(desc(Journal.written_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_journal_statistics(
    db: AsyncSession, 
    user_id: str
) -> dict:
    """Get journal statistics for a user."""
    # Total entries
    total_result = await db.execute(
        select(func.count(Journal.id))
        .where(Journal.user_id == user_id)
    )
    total_entries = total_result.scalar()
    
    # Total words
    words_result = await db.execute(
        select(func.sum(Journal.word_count))
        .where(Journal.user_id == user_id)
    )
    total_words = words_result.scalar() or 0
    
    # Most common emotions
    emotions_result = await db.execute(
        select(Journal.emotion_tags, func.count(Journal.id))
        .where(
            and_(
                Journal.user_id == user_id,
                Journal.emotion_tags.isnot(None)
            )
        )
        .group_by(Journal.emotion_tags)
        .order_by(desc(func.count(Journal.id)))
        .limit(5)
    )
    emotion_counts = emotions_result.all()
    
    return {
        "total_entries": total_entries,
        "total_words": total_words,
        "average_words_per_entry": total_words / total_entries if total_entries > 0 else 0,
        "top_emotions": [{"emotion": row[0], "count": row[1]} for row in emotion_counts]
    }

