"""Memory service using Pinecone for vector storage."""
import asyncio
from typing import List, Dict, Any, Optional
import uuid

import httpx
import openai

try:
    from pinecone import Pinecone
    HAS_PINECONE = True
except ImportError:
    HAS_PINECONE = False
    Pinecone = None

from app.core.config import get_settings

settings = get_settings()

# Initialize OpenAI for embeddings
openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

# Initialize Pinecone client
pc: Optional[Pinecone] = None
pinecone_index = None


def get_pinecone_index():
    """Return a Pinecone index lazily to avoid network calls during import."""
    global pc, pinecone_index
    if pinecone_index:
        return pinecone_index
    if not HAS_PINECONE or not settings.PINECONE_API_KEY:
        return None

    try:
        pc = pc or Pinecone(api_key=settings.PINECONE_API_KEY)
        pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
        return pinecone_index
    except Exception:
        return None


async def generate_embedding(text: str) -> List[float]:
    """Generate embedding vector for text."""
    if openai_client:
        try:
            response = await openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding
        except Exception:
            pass
    
    # Fallback: Use Hugging Face for embeddings
    if settings.HF_API_TOKEN:
        return await _generate_hf_embedding(text)
    
    # Last resort: zero vector (will match nothing)
    return [0.0] * 1536


async def _generate_hf_embedding(text: str) -> List[float]:
    """Generate embedding using Hugging Face."""
    model = "sentence-transformers/all-MiniLM-L6-v2"
    api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model}"
    headers = {"Authorization": f"Bearer {settings.HF_API_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                api_url,
                headers=headers,
                json={"inputs": text},
                timeout=30.0,
            )
            response.raise_for_status()
            result = response.json()
            
            # HF returns list of embeddings, take the first one
            if isinstance(result, list) and len(result) > 0:
                embedding = result[0]
                # Normalize to 1536 dimensions if needed
                if len(embedding) < 1536:
                    embedding.extend([0.0] * (1536 - len(embedding)))
                return embedding[:1536]
        except Exception:
            pass
    
    return [0.0] * 1536


async def store_memory(
    user_id: str,
    memory_text: str,
    emotion: Optional[str] = None,
    category: Optional[str] = None,
    importance: float = 0.5,
    source_type: Optional[str] = None,
    source_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Store a memory in Pinecone."""
    index = get_pinecone_index()
    if not index:
        # Fallback: return mock success
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "memory_text": memory_text,
            "stored": False,
            "reason": "Pinecone not configured",
        }

    # Generate embedding
    embedding = await generate_embedding(memory_text)

    # Create unique ID
    memory_id = str(uuid.uuid4())

    # Prepare metadata
    metadata = {
        "user_id": user_id,
        "memory_text": memory_text[:1000],  # Truncate for metadata
        "emotion": emotion or "neutral",
        "category": category or "general",
        "importance": importance,
        "source_type": source_type or "unknown",
        "source_id": source_id or "",
    }

    # Store in Pinecone using SDK
    try:
        await asyncio.to_thread(
            index.upsert,
            vectors=[
                {
                    "id": memory_id,
                    "values": embedding,
                    "metadata": metadata,
                }
            ]
        )

        return {
            "id": memory_id,
            "user_id": user_id,
            "memory_text": memory_text,
            "stored": True,
            "pinecone_id": memory_id,
        }
    except Exception as e:
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
) -> List[Dict[str, Any]]:
    """Retrieve relevant memories for a user."""
    index = get_pinecone_index()
    if not index:
        # Return empty list if Pinecone not configured
        return []

    # Generate query embedding
    query_embedding = await generate_embedding(query)

    # Build filter
    filter_dict = {"user_id": user_id}
    if emotion_filter:
        filter_dict["emotion"] = emotion_filter

    # Query Pinecone using SDK
    try:
        result = await asyncio.to_thread(
            index.query,
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

        return memories
    except Exception:
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
    except Exception:
        return []


async def retrieve_relevant_memories(
    user_id: str,
    query: str,
    top_k: int = 5,
    emotion_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve memories with LangChain first, then fallback to the native Pinecone client."""
    memories = await retrieve_memories_langchain(
        user_id=user_id,
        query=query,
        top_k=top_k,
        emotion_filter=emotion_filter,
    )
    if memories:
        return memories

    return await retrieve_memories(
        user_id=user_id,
        query=query,
        top_k=top_k,
        emotion_filter=emotion_filter,
    )


async def delete_memory(user_id: str, memory_id: str) -> bool:
    """Delete a memory from Pinecone."""
    index = get_pinecone_index()
    if not index:
        return False

    try:
        await asyncio.to_thread(
            index.delete,
            ids=[memory_id]
        )
        return True
    except Exception:
        return False

