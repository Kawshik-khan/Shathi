"""Chat API routes."""
import json

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, get_pinecone_index, get_redis
from app.schemas.chat import (
    ChatRequest, 
    ChatResponse, 
    Conversation as ConversationSchema, 
    MessageCreate,
    Message as MessageSchema
)
from app.services.chat import (
    send_chat_message_stream,
    send_chat_message,
    get_conversations,
    get_conversation_by_id,
    get_conversation_messages,
    delete_conversation,
    update_conversation
)
from app.models.user import User
from app.models.conversation import Conversation as ConversationModel, Message as MessageModel

router = APIRouter()


@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    pinecone_index=Depends(get_pinecone_index),
) -> ChatResponse:
    """Send a message to the AI and get a response."""
    try:
        conversation, user_message, ai_message = await send_chat_message(
            db=db,
            user_id=current_user.id,
            message_content=request.message,
            conversation_id=request.conversation_id,
            model=request.model,
            language=request.language,
            redis=redis,
            pinecone_index=pinecone_index,
        )

        return ChatResponse(
            response=ai_message.content,
            conversation_id=conversation.id,
            message_id=ai_message.id,
            emotion_detected=ai_message.emotion,
            crisis_flag=ai_message.crisis_flag,
            model_used=ai_message.model_used,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )


@router.post("/stream")
async def stream_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
    pinecone_index=Depends(get_pinecone_index),
) -> StreamingResponse:
    """Send a message and stream the AI response as SSE chunks."""

    async def event_stream():
        try:
            async for event in send_chat_message_stream(
                db=db,
                user_id=current_user.id,
                message_content=request.message,
                conversation_id=request.conversation_id,
                model=request.model,
                language=request.language,
                redis=redis,
                pinecone_index=pinecone_index,
            ):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except ValueError as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Failed to stream message'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/conversations", response_model=List[ConversationSchema])
async def list_conversations(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[ConversationSchema]:
    """List all conversations for the current user."""
    conversations = await get_conversations(db, current_user.id, limit, offset)
    
    return [
        ConversationSchema(
            id=conv.id,
            user_id=conv.user_id,
            language=conv.language,
            title=conv.title,
            summary=conv.summary,
            emotion_context=conv.emotion_context,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        )
        for conv in conversations
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationSchema)
async def get_conversation_endpoint(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationSchema:
    """Get a specific conversation with messages."""
    conversation = await get_conversation_by_id(db, current_user.id, conversation_id)
    
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    # Get messages for this conversation
    messages = await get_conversation_messages(db, conversation_id)
    
    # Convert to schema with messages
    return ConversationSchema(
        id=conversation.id,
        user_id=conversation.user_id,
        language=conversation.language,
        title=conversation.title,
        summary=conversation.summary,
        emotion_context=conversation.emotion_context,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageSchema(
                id=msg.id,
                conversation_id=msg.conversation_id,
                role=msg.role,
                content=msg.content,
                emotion=msg.emotion,
                emotion_confidence=msg.emotion_confidence,
                model_used=msg.model_used,
                token_count=msg.token_count,
                crisis_flag=msg.crisis_flag,
                crisis_severity=msg.crisis_severity,
                created_at=msg.created_at,
            )
            for msg in messages
        ]
    )


@router.post("/conversations", response_model=ConversationSchema, status_code=status.HTTP_201_CREATED)
async def create_conversation_endpoint(
    title: str = Query("New Chat"),
    language: str = Query("bn"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationSchema:
    """Create a new conversation."""
    from app.services.chat import create_conversation
    
    conversation = await create_conversation(db, current_user.id, title, language)
    
    return ConversationSchema(
        id=conversation.id,
        user_id=conversation.user_id,
        language=conversation.language,
        title=conversation.title,
        summary=conversation.summary,
        emotion_context=conversation.emotion_context,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


@router.put("/conversations/{conversation_id}", response_model=ConversationSchema)
async def update_conversation_endpoint(
    conversation_id: str,
    title: str = Query(None),
    summary: str = Query(None),
    emotion_context: str = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationSchema:
    """Update conversation metadata."""
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if summary is not None:
        update_data["summary"] = summary
    if emotion_context is not None:
        update_data["emotion_context"] = emotion_context
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided"
        )
    
    updated_conversation = await update_conversation(
        db, current_user.id, conversation_id, **update_data
    )
    
    if not updated_conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    return ConversationSchema(
        id=updated_conversation.id,
        user_id=updated_conversation.user_id,
        language=updated_conversation.language,
        title=updated_conversation.title,
        summary=updated_conversation.summary,
        emotion_context=updated_conversation.emotion_context,
        created_at=updated_conversation.created_at,
        updated_at=updated_conversation.updated_at,
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation_endpoint(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a conversation and all its messages."""
    success = await delete_conversation(db, current_user.id, conversation_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

