"""Memory model for AI companion."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Memory(Base):
    """Semantic memory for AI companion."""
    
    __tablename__ = "memories"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Memory content
    memory_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Metadata for Pinecone
    pinecone_id: Mapped[str | None] = mapped_column(
        String(36),
        unique=True,
        index=True,
        nullable=True,
    )
    
    # Importance and emotion
    importance: Mapped[float] = mapped_column(Float, default=0.5)
    emotion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    category: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )  # 'preference', 'event', 'goal', 'relationship', etc.
    
    # Source
    source_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )  # 'chat', 'journal', 'mood', 'habit', 'manual'
    source_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    last_accessed: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    
    # Relationships
    user = relationship("User", back_populates="memories")

