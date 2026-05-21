"""Background conversation summarization."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.conversation import Conversation, Message
from app.services.ai import MODEL_REGISTRY, _get_hf_client

logger = logging.getLogger(__name__)


async def summarize_conversation(db: AsyncSession, conversation_id: str) -> None:
    """Summarize older messages outside the recent chat window."""
    settings = get_settings()

    conversation_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = conversation_result.scalar_one_or_none()
    if not conversation:
        return

    message_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    messages = list(message_result.scalars().all())
    if len(messages) <= settings.CHAT_HISTORY_LIMIT:
        return

    older_messages = messages[: -settings.CHAT_HISTORY_LIMIT]
    transcript = "\n".join(
        f"{message.role}: {message.content}"
        for message in older_messages
        if message.content
    )
    if not transcript:
        return

    prompt = (
        "Create a concise rolling summary of the earlier conversation for future chat context. "
        "Preserve user preferences, important personal details, emotional themes, and unresolved topics. "
        "Do not include advice or safety instructions unless they were part of the conversation.\n\n"
        f"Existing summary:\n{conversation.summary or 'None'}\n\n"
        f"Earlier transcript:\n{transcript}"
    )

    client = _get_hf_client()
    model_id = MODEL_REGISTRY["llama-3.3-70b"]
    response = await client.chat.completions.create(
        model=model_id,
        messages=[
            {
                "role": "system",
                "content": "You summarize conversations compactly for an AI assistant memory.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=300,
    )
    summary = response.choices[0].message.content
    if not summary:
        return

    conversation.summary = summary.strip()
    await db.commit()


async def summarize_conversation_background(conversation_id: str) -> None:
    """Run summarization in its own DB session so chat requests do not wait."""
    try:
        async with AsyncSessionLocal() as db:
            await summarize_conversation(db, conversation_id)
    except Exception as exc:
        logger.warning(
            "Conversation summarization failed for %s: %s",
            conversation_id,
            exc,
        )
