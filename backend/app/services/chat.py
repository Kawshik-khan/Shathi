"""Chat service for database operations."""
import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.conversation import Conversation, Message
from app.schemas.chat import Conversation as ConversationSchema, MessageCreate
from app.services.ai import (
    generate_chat_response,
    generate_streaming_response,
    needs_style_rewrite,
    rewrite_chat_response,
)
from app.services.chat_context import build_chat_context
from app.services.crisis import detect_crisis, filter_unsafe_assistant_response
from app.services.emotion import detect_emotion
from app.services.localization import (
    normalize_language,
    requests_english,
    should_switch_to_bangla,
    should_switch_to_english,
)
from app.services.summarization import summarize_conversation_background


def _chat_history_limit() -> int:
    return get_settings().CHAT_HISTORY_LIMIT


async def _maybe_schedule_summary(db: AsyncSession, conversation_id: str) -> None:
    result = await db.execute(
        select(func.count(Message.id)).where(Message.conversation_id == conversation_id)
    )
    message_count = result.scalar() or 0
    if message_count > 0 and message_count % 20 == 0:
        asyncio.create_task(summarize_conversation_background(conversation_id))


def _select_conversation_language(
    conversation: Conversation,
    message_content: str,
    requested_language: Optional[str] = None,
) -> str:
    """Choose and persist the language for a conversation."""
    if requested_language:
        selected_language = normalize_language(requested_language)
    elif requests_english(message_content):
        selected_language = "en"
    elif should_switch_to_bangla(message_content):
        selected_language = "bn"
    elif should_switch_to_english(message_content):
        selected_language = "en"
    else:
        selected_language = normalize_language(conversation.language)

    if conversation.language != selected_language:
        conversation.language = selected_language

    return selected_language


async def create_conversation(
    db: AsyncSession, 
    user_id: str, 
    title: Optional[str] = None,
    language: str = "bn",
) -> Conversation:
    """Create a new conversation."""
    conversation = Conversation(
        user_id=user_id,
        title=title,
        language=normalize_language(language),
    )
    
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    
    return conversation


async def get_conversations(
    db: AsyncSession, 
    user_id: str, 
    limit: int = 20,
    offset: int = 0
) -> List[Conversation]:
    """Get conversations for a user with pagination."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(desc(Conversation.updated_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_conversation_by_id(
    db: AsyncSession, 
    user_id: str, 
    conversation_id: str
) -> Optional[Conversation]:
    """Get a specific conversation with its messages."""
    result = await db.execute(
        select(Conversation)
        .where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
        )
    )
    return result.scalar_one_or_none()


async def create_message(
    db: AsyncSession, 
    conversation_id: str, 
    role: str, 
    content: str,
    emotion: Optional[str] = None,
    emotion_confidence: Optional[float] = None,
    model_used: Optional[str] = None,
    token_count: Optional[int] = None,
    crisis_flag: bool = False,
    crisis_severity: Optional[str] = None
) -> Message:
    """Create a new message in a conversation."""
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        emotion=emotion,
        emotion_confidence=emotion_confidence,
        model_used=model_used,
        token_count=token_count,
        crisis_flag=crisis_flag,
        crisis_severity=crisis_severity,
    )
    
    db.add(message)
    
    # Update conversation timestamp
    conversation_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = conversation_result.scalar_one_or_none()
    if conversation:
        conversation.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(message)
    
    return message


async def get_conversation_messages(
    db: AsyncSession, 
    conversation_id: str,
    limit: Optional[int] = None,
) -> List[Message]:
    """Get all messages in a conversation."""
    statement = select(Message).where(Message.conversation_id == conversation_id)

    if limit is not None:
        result = await db.execute(
            statement.order_by(desc(Message.created_at)).limit(limit)
        )
        return list(reversed(result.scalars().all()))

    result = await db.execute(statement.order_by(Message.created_at))
    return result.scalars().all()


async def send_chat_message(
    db: AsyncSession, 
    user_id: str, 
    message_content: str,
    conversation_id: Optional[str] = None,
    model: str = "llama-3.3-70b",
    language: Optional[str] = None,
    redis=None,
    pinecone_index=None,
) -> tuple[Conversation, Message, Message]:
    """Send a message and get AI response."""
    # Get or create conversation
    if conversation_id:
        conversation = await get_conversation_by_id(db, user_id, conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")
    else:
        # Create new conversation
        initial_language = "en" if should_switch_to_english(message_content) else "bn"
        conversation = await create_conversation(
            db,
            user_id,
            title="New Chat",
            language=language or initial_language,
        )

    selected_language = _select_conversation_language(
        conversation,
        message_content,
        language,
    )

    crisis_result = await detect_crisis(message_content)
    
    # Detect emotion in user message
    emotion_result = await detect_emotion(message_content)
    
    # Create user message
    user_message = await create_message(
        db=db,
        conversation_id=conversation.id,
        role="user",
        content=message_content,
        emotion=emotion_result.emotion,
        emotion_confidence=emotion_result.confidence,
        crisis_flag=crisis_result.is_crisis,
        crisis_severity=crisis_result.severity.value if crisis_result.is_crisis else None,
    )

    if crisis_result.is_crisis:
        ai_message = await create_message(
            db=db,
            conversation_id=conversation.id,
            role="assistant",
            content=crisis_result.response_template,
            emotion="supportive",
            emotion_confidence=1.0,
            model_used="crisis-safety",
            crisis_flag=True,
            crisis_severity=crisis_result.severity.value,
        )

        if conversation.title == "New Chat":
            conversation.title = message_content[:50] + "..." if len(message_content) > 50 else message_content
            await db.commit()

        return conversation, user_message, ai_message
    
    # Get conversation history for context
    history_limit = _chat_history_limit()
    messages = await get_conversation_messages(
        db,
        conversation.id,
        limit=history_limit + 1,
    )
    
    # Format messages for AI
    conversation_history = []
    for msg in messages:
        if msg.id == user_message.id:
            continue
        conversation_history.append({
            "role": msg.role,
            "content": msg.content
        })
    conversation_history = conversation_history[-history_limit:]

    chat_context = await build_chat_context(
        db=db,
        user_id=user_id,
        message=message_content,
        conversation_id=conversation.id,
        language=selected_language,
        redis=redis,
        pinecone_index=pinecone_index,
    )
    
    # Generate AI response
    ai_response_content = await generate_chat_response(
        message=message_content,
        conversation_history=conversation_history,
        model=model,
        language=selected_language,
        user_context=chat_context.text,
        conversation_summary=conversation.summary,
        stream=False,
    )
    unsafe_response, filtered_response = filter_unsafe_assistant_response(ai_response_content)
    ai_response_content = filtered_response
    if not unsafe_response and needs_style_rewrite(ai_response_content):
        ai_response_content = await rewrite_chat_response(
            message=message_content,
            assistant_response=ai_response_content,
            conversation_history=conversation_history,
            model=model,
            language=selected_language,
            user_context=chat_context.text,
            conversation_summary=conversation.summary,
        )
    
    # Detect emotion in AI response
    ai_emotion_result = await detect_emotion(ai_response_content)
    
    # Create AI message
    ai_message = await create_message(
        db=db,
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response_content,
        emotion=ai_emotion_result.emotion,
        emotion_confidence=ai_emotion_result.confidence,
        model_used=model,
        crisis_flag=unsafe_response,
        crisis_severity="medium" if unsafe_response else None,
    )
    await _maybe_schedule_summary(db, conversation.id)
    
    # Update conversation title if this is the first exchange
    if conversation.title == "New Chat":
        # Generate a title from the first user message
        title = message_content[:50] + "..." if len(message_content) > 50 else message_content
        conversation.title = title
        await db.commit()
    
    return conversation, user_message, ai_message


async def send_chat_message_stream(
    db: AsyncSession,
    user_id: str,
    message_content: str,
    conversation_id: Optional[str] = None,
    model: str = "llama-3.3-70b",
    language: Optional[str] = None,
    redis=None,
    pinecone_index=None,
):
    """Send a message and yield streaming response events."""
    if conversation_id:
        conversation = await get_conversation_by_id(db, user_id, conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")
    else:
        initial_language = "en" if should_switch_to_english(message_content) else "bn"
        conversation = await create_conversation(
            db,
            user_id,
            title="New Chat",
            language=language or initial_language,
        )

    selected_language = _select_conversation_language(
        conversation,
        message_content,
        language,
    )

    crisis_result = await detect_crisis(message_content)
    emotion_result = await detect_emotion(message_content)

    user_message = await create_message(
        db=db,
        conversation_id=conversation.id,
        role="user",
        content=message_content,
        emotion=emotion_result.emotion,
        emotion_confidence=emotion_result.confidence,
        crisis_flag=crisis_result.is_crisis,
        crisis_severity=crisis_result.severity.value if crisis_result.is_crisis else None,
    )

    yield {
        "type": "meta",
        "conversation_id": conversation.id,
        "user_message_id": user_message.id,
        "crisis_flag": crisis_result.is_crisis,
        "language": selected_language,
    }

    if crisis_result.is_crisis:
        ai_message = await create_message(
            db=db,
            conversation_id=conversation.id,
            role="assistant",
            content=crisis_result.response_template,
            emotion="supportive",
            emotion_confidence=1.0,
            model_used="crisis-safety",
            crisis_flag=True,
            crisis_severity=crisis_result.severity.value,
        )
        yield {"type": "chunk", "chunk": crisis_result.response_template}
        yield {
            "type": "done",
            "conversation_id": conversation.id,
            "message_id": ai_message.id,
            "crisis_flag": True,
            "model_used": "crisis-safety",
            "language": selected_language,
        }
        return

    history_limit = _chat_history_limit()
    messages = await get_conversation_messages(
        db,
        conversation.id,
        limit=history_limit + 1,
    )
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
        if msg.id != user_message.id
    ]
    conversation_history = conversation_history[-history_limit:]
    chat_context = await build_chat_context(
        db=db,
        user_id=user_id,
        message=message_content,
        conversation_id=conversation.id,
        language=selected_language,
        redis=redis,
        pinecone_index=pinecone_index,
    )

    chunks: list[str] = []
    async for chunk in generate_streaming_response(
        message=message_content,
        conversation_history=conversation_history,
        model=model,
        language=selected_language,
        user_context=chat_context.text,
        conversation_summary=conversation.summary,
    ):
        chunks.append(chunk)
        yield {"type": "chunk", "chunk": chunk}

    ai_response_content = "".join(chunks)
    unsafe_response, filtered_response = filter_unsafe_assistant_response(ai_response_content)
    ai_response_content = filtered_response

    if unsafe_response:
        yield {"type": "replace", "content": filtered_response}
    elif needs_style_rewrite(ai_response_content):
        ai_response_content = await rewrite_chat_response(
            message=message_content,
            assistant_response=ai_response_content,
            conversation_history=conversation_history,
            model=model,
            language=selected_language,
            user_context=chat_context.text,
            conversation_summary=conversation.summary,
        )
        yield {"type": "replace", "content": ai_response_content}

    ai_emotion_result = await detect_emotion(ai_response_content)
    ai_message = await create_message(
        db=db,
        conversation_id=conversation.id,
        role="assistant",
        content=ai_response_content,
        emotion=ai_emotion_result.emotion,
        emotion_confidence=ai_emotion_result.confidence,
        model_used=model,
        crisis_flag=unsafe_response,
        crisis_severity="medium" if unsafe_response else None,
    )
    await _maybe_schedule_summary(db, conversation.id)

    if conversation.title == "New Chat":
        conversation.title = message_content[:50] + "..." if len(message_content) > 50 else message_content
        await db.commit()

    yield {
        "type": "done",
        "conversation_id": conversation.id,
        "message_id": ai_message.id,
        "crisis_flag": unsafe_response,
        "model_used": model,
        "language": selected_language,
    }


async def delete_conversation(
    db: AsyncSession, 
    user_id: str, 
    conversation_id: str
) -> bool:
    """Delete a conversation and all its messages."""
    conversation = await get_conversation_by_id(db, user_id, conversation_id)
    
    if conversation:
        await db.delete(conversation)
        await db.commit()
        return True
    
    return False


async def update_conversation(
    db: AsyncSession, 
    user_id: str, 
    conversation_id: str,
    title: Optional[str] = None,
    summary: Optional[str] = None,
    emotion_context: Optional[str] = None
) -> Optional[Conversation]:
    """Update conversation metadata."""
    conversation = await get_conversation_by_id(db, user_id, conversation_id)
    
    if not conversation:
        return None
    
    if title is not None:
        conversation.title = title
    if summary is not None:
        conversation.summary = summary
    if emotion_context is not None:
        conversation.emotion_context = emotion_context
    
    conversation.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(conversation)
    
    return conversation


async def get_conversation_analytics(
    db: AsyncSession, 
    user_id: str
) -> dict:
    """Get analytics for user's conversations."""
    # Total conversations
    total_result = await db.execute(
        select(func.count(Conversation.id))
        .where(Conversation.user_id == user_id)
    )
    total_conversations = total_result.scalar()
    
    # Total messages
    messages_result = await db.execute(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.user_id == user_id)
    )
    total_messages = messages_result.scalar()
    
    # Crisis flags
    crisis_result = await db.execute(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            and_(
                Conversation.user_id == user_id,
                Message.crisis_flag == True
            )
        )
    )
    crisis_messages = crisis_result.scalar()
    
    # Common emotions
    emotions_result = await db.execute(
        select(Message.emotion, func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            and_(
                Conversation.user_id == user_id,
                Message.emotion.isnot(None)
            )
        )
        .group_by(Message.emotion)
        .order_by(desc(func.count(Message.id)))
        .limit(5)
    )
    emotion_counts = emotions_result.all()
    
    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "crisis_messages": crisis_messages,
        "average_messages_per_conversation": total_messages / total_conversations if total_conversations > 0 else 0,
        "top_emotions": [{"emotion": row[0], "count": row[1]} for row in emotion_counts]
    }

