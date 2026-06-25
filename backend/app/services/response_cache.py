"""Semantic response cache using Pinecone for near-duplicate chat replies."""
import asyncio
import logging
import uuid
from typing import Optional

from app.core.config import get_settings
from app.services.memory import generate_embedding

logger = logging.getLogger(__name__)
settings = get_settings()


async def lookup_cached_response(
    user_id: str,
    message: str,
    pinecone_index=None,
) -> Optional[str]:
    """Return a cached reply for a near-duplicate user message, or None.

    Embeds the message and queries the per-user response-cache namespace.
    Returns the cached reply only when the top similarity score meets the
    configured threshold. Fails open (returns None) on any error.
    """
    if not settings.RESPONSE_CACHE_ENABLED or not pinecone_index:
        return None

    try:
        async with asyncio.timeout(settings.EMBEDDING_TIMEOUT_SECONDS):
            query_embedding = await generate_embedding(message)
            result = await asyncio.to_thread(
                pinecone_index.query,
                vector=query_embedding,
                top_k=1,
                namespace=settings.RESPONSE_CACHE_NAMESPACE,
                filter={"user_id": user_id},
                include_metadata=True,
            )

        matches = result.get("matches", [])
        if not matches:
            return None

        top = matches[0]
        if top.get("score", 0.0) >= settings.RESPONSE_CACHE_SIMILARITY_THRESHOLD:
            reply = top.get("metadata", {}).get("reply")
            if reply:
                return reply
        return None
    except Exception as exc:
        logger.warning("Response cache lookup failed: %s", exc)
        return None


async def store_cached_response(
    user_id: str,
    message: str,
    reply: str,
    pinecone_index=None,
) -> None:
    """Store a user message + assistant reply in the response-cache namespace.

    Time-bounded and fails open (no-op) on any error.
    """
    if not settings.RESPONSE_CACHE_ENABLED or not pinecone_index:
        return

    try:
        async with asyncio.timeout(settings.EMBEDDING_TIMEOUT_SECONDS):
            embedding = await generate_embedding(message)
            metadata = {
                "user_id": user_id,
                "query": message[:1000],
                "reply": reply,
            }
            await asyncio.to_thread(
                pinecone_index.upsert,
                vectors=[
                    {
                        "id": str(uuid.uuid4()),
                        "values": embedding,
                        "metadata": metadata,
                    }
                ],
                namespace=settings.RESPONSE_CACHE_NAMESPACE,
            )
    except Exception as exc:
        logger.warning("Response cache store failed: %s", exc)
