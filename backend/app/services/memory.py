"""Memory service using Pinecone for vector storage."""
import asyncio
import hashlib
import json
import logging
from collections import OrderedDict
from typing import Any, Dict, List, Optional
import uuid

import httpx
import openai

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize OpenAI for embeddings
#
# ``max_retries=0`` is critical: the [redacted] SDK ships its own httpx
# retry transport that sleeps ``0.5s, 1.0s`` (and longer under network
# backpressure) inside the awaited coroutine. Those sleeps shield the
# outer ``asyncio.timeout`` from cancelling the embeddings call on the
# configured per-provider budget (CHAT_PROVIDER_TIMEOUT_MS=800ms),
# which in turn stalls the chat-stream gather past its hard budget and
# surfaces as a "failed to stream" toast on the client. We disable the
# SDK retries so a single failed call fails fast and the outer timeout
# can do its job.
openai_client = (
    openai.AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        max_retries=0,
        timeout=settings.EMBEDDING_TIMEOUT_SECONDS,
    )
    if settings.OPENAI_API_KEY
    else None
)


# ---------------------------------------------------------------------------
# Embedding cache (RAG optimization)
# ---------------------------------------------------------------------------
# Two-tier: an in-process LRU for speed (single-digit ms), and a Redis
# fallback for cross-worker reuse. Cache only covers the OpenAI path;
# the HF fallback has a different vector shape and is intentionally
# excluded to avoid dimension mixing on retrieval.

_EMBEDDING_LRU: "OrderedDict[str, List[float]]" = OrderedDict()


# Shared HTTP client for HF inference. Re-using the connection pool
# saves ~50-150 ms per embedding call vs. opening a new client each
# time (HF fallback path; primary embedding uses OpenAI SDK directly).
_HF_CLIENT: Optional[httpx.AsyncClient] = None


def _get_hf_client() -> Optional[httpx.AsyncClient]:
    global _HF_CLIENT
    if _HF_CLIENT is None:
        _HF_CLIENT = httpx.AsyncClient(timeout=10.0)
    return _HF_CLIENT


async def close_embedding_clients() -> None:
    """Close shared HTTP resources. Call from FastAPI lifespan shutdown."""
    global _HF_CLIENT
    if _HF_CLIENT is not None:
        try:
            await _HF_CLIENT.aclose()
        except Exception:  # noqa: BLE001
            pass
        _HF_CLIENT = None


def _normalize_for_cache(text: str) -> str:
    """Normalize whitespace before hashing so trivial variations collide."""
    return " ".join((text or "").split())


def _embedding_key(text: str) -> str:
    return hashlib.sha256(_normalize_for_cache(text).encode("utf-8")).hexdigest()


def _embedding_redis_key(text: str) -> str:
    return f"embed:{_embedding_key(text)[:32]}"


def _lru_get(key: str) -> Optional[List[float]]:
    if key not in _EMBEDDING_LRU:
        return None
    # Move to end so LRU eviction sees recent usage.
    _EMBEDDING_LRU.move_to_end(key)
    return _EMBEDDING_LRU[key]


def _lru_put(key: str, value: List[float]) -> None:
    cap = max(1, int(get_settings().EMBEDDING_CACHE_MAX_ENTRIES))
    _EMBEDDING_LRU[key] = value
    _EMBEDDING_LRU.move_to_end(key)
    while len(_EMBEDDING_LRU) > cap:
        _EMBEDDING_LRU.popitem(last=False)


async def _redis_get_embedding(key: str, redis: Any) -> Optional[List[float]]:
    """Fetch a cached embedding from Redis.

    ``key`` is the full SHA-256 hex digest produced by ``_embedding_key``.
    We use the first 32 hex chars as the Redis key suffix to keep it short.
    """
    if redis is None:
        return None
    try:
        raw = await redis.get(f"embed:{key[:32]}")
    except Exception as exc:  # noqa: BLE001 - cache must never raise
        logger.warning("embedding cache get failed: %s", exc)
        return None
    if not raw:
        return None
    try:
        return list(json.loads(raw))
    except (TypeError, ValueError):
        return None


async def _redis_put_embedding(key: str, value: List[float], redis: Any) -> None:
    if redis is None:
        return
    try:
        await redis.set(
            f"embed:{key[:32]}",
            json.dumps(value),
            ex=int(get_settings().EMBEDDING_CACHE_TTL_SECONDS),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("embedding cache set failed: %s", exc)


async def generate_embedding(
    text: str,
    *,
    redis: Any = None,
) -> List[float]:
    """Generate embedding vector for text.

    Lookup order: in-process LRU → Redis → OpenAI. The HF fallback is
    intentionally not cached because it produces a different vector
    shape that would corrupt Pinecone similarity scoring.

    Vector width is governed by ``settings.EMBEDDING_DIM`` and MUST
    match the configured Pinecone index exactly; the legacy hardcoded
    1536-d shape caused ``Vector dimension 1536 does not match the
    dimension of the index 1024`` errors on every retrieval.
    """
    settings_ = get_settings()
    dim = int(settings_.EMBEDDING_DIM)
    if not text:
        return [0.0] * dim

    if settings_.EMBEDDING_CACHE_ENABLED:
        cache_key = _embedding_key(text)
        cached = _lru_get(cache_key)
        if cached is not None:
            return cached
        cached = await _redis_get_embedding(cache_key, redis)
        if cached is not None:
            _lru_put(cache_key, cached)
            return cached

    embedding: List[float]
    if openai_client:
        try:
            response = await openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            embedding = list(response.data[0].embedding)
            if settings_.EMBEDDING_CACHE_ENABLED:
                _lru_put(_embedding_key(text), embedding)
                await _redis_put_embedding(_embedding_key(text), embedding, redis)
            return embedding
        except Exception:
            pass

    # Fallback: Use Hugging Face for embeddings (uncached on purpose).
    if settings_.HF_API_TOKEN:
        return await _generate_hf_embedding(text)

    # Last resort: zero vector (will match nothing)
    return [0.0] * dim


async def _generate_hf_embedding(text: str) -> List[float]:
    """Generate embedding using a shared Hugging Face inference client."""
    model = "sentence-transformers/all-MiniLM-L6-v2"
    api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model}"
    headers = {"Authorization": f"Bearer {settings.HF_API_TOKEN}"}

    # Match the configured Pinecone index width exactly. HF MiniLM
    # returns 384-d, which we pad/truncate to fit. Keeping this
    # driven by ``EMBEDDING_DIM`` prevents the historical drift
    # between ``memory.py`` (1536) and the live index (1024).
    dim = int(get_settings().EMBEDDING_DIM)

    client = _get_hf_client()
    if client is None:
        return [0.0] * dim

    try:
        response = await client.post(
            api_url,
            headers=headers,
            json={"inputs": text},
        )
        response.raise_for_status()
        result = response.json()

        # HF returns list of embeddings, take the first one
        if isinstance(result, list) and len(result) > 0:
            embedding = result[0]
            # Normalize to the configured index width if needed
            if len(embedding) < dim:
                embedding = list(embedding) + [0.0] * (dim - len(embedding))
            return list(embedding[:dim])
    except Exception as exc:
        logger.warning("HF embedding failed: %s", exc)

    return [0.0] * dim


async def store_memory(
    user_id: str,
    memory_text: str,
    emotion: Optional[str] = None,
    category: Optional[str] = None,
    importance: float = 0.5,
    source_type: Optional[str] = None,
    source_id: Optional[str] = None,
    pinecone_index=None,
    redis: Any = None,
) -> Dict[str, Any]:
    """Store a memory in Pinecone."""
    if not pinecone_index:
        # Fallback: return mock success
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "memory_text": memory_text,
            "stored": False,
            "reason": "Pinecone not configured",
        }

    # Create unique ID
    memory_id = str(uuid.uuid4())

    # Store in Pinecone using SDK
    try:
        async with asyncio.timeout(settings.EMBEDDING_TIMEOUT_SECONDS):
            embedding = await generate_embedding(memory_text, redis=redis)
            metadata = {
                "user_id": user_id,
                "memory_text": memory_text[:1000],  # Truncate for metadata
                "emotion": emotion or "neutral",
                "category": category or "general",
                "importance": importance,
                "source_type": source_type or "unknown",
                "source_id": source_id or "",
            }
            await asyncio.to_thread(
                pinecone_index.upsert,
                vectors=[
                    {
                        "id": memory_id,
                        "values": embedding,
                        "metadata": metadata,
                    }
                ],
            )

        return {
            "id": memory_id,
            "user_id": user_id,
            "memory_text": memory_text,
            "stored": True,
            "pinecone_id": memory_id,
        }
    except Exception as e:
        logger.warning("Pinecone store failed: %s", e)
        return {
            "id": memory_id,
            "user_id": user_id,
            "memory_text": memory_text,
            "stored": False,
            "reason": str(e),
        }


async def retrieve_memories(
    user_id: str,
    query: str,
    top_k: int = 5,
    emotion_filter: Optional[str] = None,
    pinecone_index=None,
    redis: Any = None,
    *,
    score_floor: Optional[float] = None,
    min_keep: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Retrieve relevant memories for a user.

    When ``score_floor`` is provided, matches with a similarity score
    below the floor are dropped unless fewer than ``min_keep`` would
    remain. This lets the chat path keep the embedding call cost low
    (smaller ``top_k``) while still returning something useful when
    results are weak.
    """
    if not pinecone_index:
        # Return empty list if Pinecone not configured
        return []

    # Query Pinecone using SDK
    try:
        async with asyncio.timeout(settings.EMBEDDING_TIMEOUT_SECONDS):
            query_embedding = await generate_embedding(query, redis=redis)
            filter_dict = {"user_id": user_id}
            if emotion_filter:
                filter_dict["emotion"] = emotion_filter

            result = await asyncio.to_thread(
                pinecone_index.query,
                vector=query_embedding,
                top_k=top_k,
                filter=filter_dict,
                include_metadata=True,
            )

        memories = []
        for match in result.get("matches", []):
            memories.append({
                "id": match["id"],
                "score": match["score"],
                "memory_text": match["metadata"].get("memory_text", ""),
                "emotion": match["metadata"].get("emotion", "neutral"),
                "category": match["metadata"].get("category", "general"),
                "importance": match["metadata"].get("importance", 0.5),
            })

        if score_floor is not None and memories:
            keep = min_keep if min_keep is not None else 0
            filtered = [m for m in memories if m.get("score", 0.0) >= score_floor]
            if len(filtered) >= keep or keep == 0:
                memories = filtered
            # else: keep original (weak) results so we still surface something

        return memories
    except Exception as exc:
        logger.warning("Pinecone retrieve failed: %s", exc)
        return []


async def retrieve_memories_langchain(
    user_id: str,
    query: str,
    top_k: int = 5,
    emotion_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve relevant memories through LangChain when available."""
    if not settings.OPENAI_API_KEY or not settings.PINECONE_API_KEY:
        return []

    try:
        from langchain_openai import OpenAIEmbeddings
        from langchain_pinecone import PineconeVectorStore
    except ImportError:
        return []

    try:
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=settings.OPENAI_API_KEY,
        )
        vectorstore = PineconeVectorStore.from_existing_index(
            index_name=settings.PINECONE_INDEX_NAME,
            embedding=embeddings,
        )
        filter_dict: Dict[str, Any] = {"user_id": user_id}
        if emotion_filter:
            filter_dict["emotion"] = emotion_filter

        docs_and_scores = await asyncio.to_thread(
            vectorstore.similarity_search_with_score,
            query,
            k=top_k,
            filter=filter_dict,
        )

        memories = []
        for document, score in docs_and_scores:
            metadata = document.metadata or {}
            memories.append({
                "id": metadata.get("id") or metadata.get("source_id") or "",
                "score": score,
                "memory_text": metadata.get("memory_text") or document.page_content,
                "emotion": metadata.get("emotion", "neutral"),
                "category": metadata.get("category", "general"),
                "importance": metadata.get("importance", 0.5),
            })

        return memories
    except Exception as exc:
        logger.warning("Pinecone retrieve failed: %s", exc)
        return []


async def retrieve_relevant_memories(
    user_id: str,
    query: str,
    top_k: int = 5,
    emotion_filter: Optional[str] = None,
    pinecone_index=None,
    redis: Any = None,
    *,
    score_floor: Optional[float] = None,
    min_keep: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Retrieve memories through the startup-initialized Pinecone index."""
    return await retrieve_memories(
        user_id=user_id,
        query=query,
        top_k=top_k,
        emotion_filter=emotion_filter,
        pinecone_index=pinecone_index,
        redis=redis,
        score_floor=score_floor,
        min_keep=min_keep,
    )


async def delete_memory(user_id: str, memory_id: str, pinecone_index=None) -> bool:
    """Delete a memory from Pinecone."""
    if not pinecone_index:
        return False

    try:
        async with asyncio.timeout(settings.EMBEDDING_TIMEOUT_SECONDS):
            await asyncio.to_thread(
                pinecone_index.delete,
                ids=[memory_id],
            )
        return True
    except Exception as exc:
        logger.warning("Pinecone delete failed: %s", exc)
        return False

