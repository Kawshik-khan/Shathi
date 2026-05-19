"""Chat schemas."""
from datetime import datetime
from typing import Literal, Optional, List

from app.schemas.base import BaseSchema, TimestampedSchema


class MessageBase(BaseSchema):
    """Base message schema."""
    
    role: Literal["user", "assistant", "system"]
    content: str


class MessageCreate(MessageBase):
    """Schema for creating a message."""
    
    emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None


class Message(MessageBase, TimestampedSchema):
    """Full message schema."""
    
    id: str
    conversation_id: str
    emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None
    model_used: Optional[str] = None
    crisis_flag: bool = False
    crisis_severity: Optional[str] = None


class ConversationBase(BaseSchema):
    """Base conversation schema."""
    
    title: Optional[str] = None


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation."""
    
    pass


class Conversation(ConversationBase, TimestampedSchema):
    """Full conversation schema."""
    
    id: str
    user_id: str
    language: Literal["en", "bn"] = "bn"
    summary: Optional[str] = None
    emotion_context: Optional[str] = None
    messages: List[Message] = []


class ChatRequest(BaseSchema):
    """Chat completion request."""
    
    message: str
    conversation_id: Optional[str] = None
    model: Literal["llama-3.3-70b", "deepseek-v4-pro"] = "llama-3.3-70b"
    language: Optional[Literal["en", "bn"]] = None
    stream: bool = False


class ChatResponse(BaseSchema):
    """Chat completion response."""
    
    response: str
    conversation_id: str
    message_id: str
    emotion_detected: Optional[str] = None
    crisis_flag: bool = False
    model_used: str


class ChatStreamChunk(BaseSchema):
    """Streaming chat chunk."""
    
    chunk: str
    done: bool = False

