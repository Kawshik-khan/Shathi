"""Journal models."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Journal(Base):
    """Journal entry model."""
    
    __tablename__ = "journals"
    
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
    
    # Content
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # AI analysis
    emotion_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    emotion_tags: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )  # Comma-separated tags
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_insights: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Metadata
    word_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reading_time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Timestamps
    written_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    # Relationships
    user = relationship("User", back_populates="journals")

