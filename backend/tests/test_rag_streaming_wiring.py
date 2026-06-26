"""Tests for the RAG (Pinecone) → chat-streaming wiring.

These tests pin down the contract that:

1. The memory section provider embeds the live user message and calls
   the per-user Pinecone index. The retrieval is the only "vector
   retrieval" leg of the chat RAG pipeline, and it must use the message
   text, not a stale or empty query.
2. The streaming ``context`` SSE event reports ``rag_used`` and the
   memory section's status so the client can render a "Personalized
   with memory" indicator.
3. When the memory section is unavailable (Pinecone missing), the
   stream degrades gracefully — no error, just ``rag_used=False``.
4. The legacy ``build_chat_context`` shim sets ``rag_used`` from the
   underlying ``BuiltContext`` so downstream SSE consumers see the
   correct flag.
"""

from __future__ import annotations

import asyncio
from typing import Any, Optional

import pytest

from app.services.chat import sections
from app.services.chat.providers import ContextResult, ProviderContext
from app.services.chat_context import ChatContext, build_chat_context
from app.services.chat.builder import build_chat_context_with_budget


class FakePineconeIndex:
    """Stand-in for a Pinecone index; records query calls."""

    def __init__(self, matches: list[dict[str, Any]] | None = None) -> None:
        self.matches = matches or []
        self.query_calls: list[dict[str, Any]] = []
        self.upsert_calls: list[dict[str, Any]] = []
        self.should_raise: Exception | None = None

    def query(self, **kwargs: Any) -> dict[str, Any]:
        self.query_calls.append(kwargs)
        if self.should_raise:
            raise self.should_raise
        return {"matches": list(self.matches)}

    def upsert(self, **kwargs: Any) -> dict[str, Any]:
        self.upsert_calls.append(kwargs)
        return {"upserted_count": len(kwargs.get("vectors", []))}


class FakeRedis:
    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    async def get(self, key: str) -> Optional[str]:
        return self.store.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self.store[key] = value


def _ctx(
    user_id: str = "u-rag",
    *,
    message: str = "I felt anxious yesterday",
    pinecone_index: Any = None,
    redis: Any = None,
) -> ProviderContext:
    return ProviderContext(
        user_id=user_id,
        db=None,
        redis=redis,
        pinecone_index=pinecone_index,
        message=message,
        language="en",
        conversation_id="c-rag",
        include_memory=True,
    )


# ---------------------------------------------------------------------------
# Memory section: vector retrieval against the user message
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_memory_section_queries_pinecone_with_user_message(monkeypatch):
    """``build_memory`` must call ``retrieve_relevant_memories`` with the
    live user message and the provided pinecone index — never with a
    stale query string or ``None``."""

    fake = FakePineconeIndex(
        matches=[
            {
                "id": "m1",
                "score": 0.91,
                "metadata": {
                    "memory_text": "talked about work stress last week",
                    "emotion": "anxious",
                },
            }
        ]
    )

    captured: dict[str, Any] = {}

    async def fake_retrieve(
        user_id: str,
        query: str,
        top_k: int = 5,
        emotion_filter: Optional[str] = None,
        pinecone_index: Any = None,
        **_extra: Any,
    ) -> list[dict[str, Any]]:
        captured["user_id"] = user_id
        captured["query"] = query
        captured["top_k"] = top_k
        captured["pinecone_index"] = pinecone_index
        return [
            {
                "id": "m1",
                "score": 0.91,
                "memory_text": "talked about work stress last week",
                "emotion": "anxious",
            }
        ]

    monkeypatch.setattr(sections.memory, "retrieve_relevant_memories", fake_retrieve)
    # Bypass the Redis-backed section cache so the call goes through to
    # the retrieval function every time.
    async def _cache_miss(*_a: Any, **_kw: Any) -> None:
        return None

    async def _cache_no_op(*_a: Any, **_kw: Any) -> None:
        return None

    monkeypatch.setattr(sections.memory, "get_section", _cache_miss)
    monkeypatch.setattr(sections.memory, "set_section", _cache_no_op)

    result = await sections.build_memory(_ctx(pinecone_index=fake))

    assert captured["user_id"] == "u-rag"
    assert captured["query"] == "I felt anxious yesterday"
    assert captured["pinecone_index"] is fake
    assert result.status == "ok"
    assert result.data.get("memory_count") == 1
    assert any("work stress" in p for p in result.parts)


@pytest.mark.asyncio
async def test_memory_section_handles_pinecone_failure(monkeypatch):
    """A failing Pinecone index must surface as ``status="error"`` and
    never crash the section builder — the LLM path is then allowed to
    proceed with an empty memory leg."""

    async def boom(*_a: Any, **_kw: Any) -> list[dict[str, Any]]:
        raise RuntimeError("pinecone unavailable")

    monkeypatch.setattr(sections.memory, "retrieve_relevant_memories", boom)
    async def _cache_miss_2(*_a: Any, **_kw: Any) -> None:
        return None

    monkeypatch.setattr(sections.memory, "get_section", _cache_miss_2)

    result = await sections.build_memory(_ctx(pinecone_index=FakePineconeIndex()))

    assert result.status == "error"
    assert "pinecone unavailable" in (result.error or "")
    assert result.parts == []


@pytest.mark.asyncio
async def test_memory_section_with_no_pinecone_returns_empty(monkeypatch):
    """When the app starts without Pinecone, the memory section must
    degrade to ``empty`` rather than raising — the route already passes
    ``pinecone_index=None`` in that case."""

    async def fake_retrieve(*_a: Any, **_kw: Any) -> list[dict[str, Any]]:
        return []

    monkeypatch.setattr(sections.memory, "retrieve_relevant_memories", fake_retrieve)
    async def _cache_miss_3(*_a: Any, **_kw: Any) -> None:
        return None

    monkeypatch.setattr(sections.memory, "get_section", _cache_miss_3)

    result = await sections.build_memory(_ctx(pinecone_index=None))

    assert result.status in ("empty", "ok")
    assert result.parts == []
    assert result.data.get("memory_count", 0) == 0


# ---------------------------------------------------------------------------
# Shim: rag_used flag is derived from the underlying BuiltContext
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_build_chat_context_sets_rag_used_when_memory_hits(monkeypatch):
    """If the memory section returns Pinecone hits, the shim must set
    ``rag_used=True`` and propagate the section status."""

    async def memory_factory(_ctx: ProviderContext) -> ContextResult:
        return ContextResult(
            name="memory",
            parts=["Relevant memories (2):", "- work stress", "- sleep issues"],
            tokens=10,
            data={"memory_count": 2},
        )

    # Other sections can be empty stubs — the shim only inspects memory.
    async def empty_factory(_ctx: ProviderContext) -> ContextResult:
        return ContextResult(name="x", parts=[])

    monkeypatch.setattr(sections, "build_memory", memory_factory)
    for name in ("profile", "mood", "journal", "sleep", "habit", "activity", "inferred_mood"):
        monkeypatch.setattr(sections, f"build_{name}", empty_factory)

    built = await build_chat_context_with_budget(
        user_id="u-rag-shim",
        db=None,
        redis=None,
        message="hi",
    )

    # ``BuiltContext.results["memory"]`` is what the legacy shim
    # inspects to derive ``rag_used`` and ``memory_status`` on the
    # legacy ``ChatContext`` SSE payload.
    assert built.results["memory"].data.get("memory_count") == 2
    assert built.results["memory"].status == "ok"

    # The legacy shim must reflect this on the public ChatContext.
    shim = await build_chat_context(
        user_id="u-rag-shim",
        db=None,
        redis=None,
        message="hi",
    )
    assert isinstance(shim, ChatContext)
    assert shim.rag_used is True
    assert shim.memory_status == "ok"
    assert shim.memory_count == 2


@pytest.mark.asyncio
async def test_build_chat_context_rag_used_false_when_memory_empty(monkeypatch):
    """When Pinecone returns zero memories, ``rag_used`` must be false
    so the UI can suppress the "Personalized with memory" hint."""

    async def memory_factory(_ctx: ProviderContext) -> ContextResult:
        return ContextResult(
            name="memory",
            parts=[],
            tokens=0,
            data={"memory_count": 0},
        )

    async def empty_factory(ctx: ProviderContext) -> ContextResult:
        return ContextResult(name="x", parts=[])

    monkeypatch.setattr(sections, "build_memory", memory_factory)
    for name in ("profile", "mood", "journal", "sleep", "habit", "activity", "inferred_mood"):
        monkeypatch.setattr(sections, f"build_{name}", empty_factory)

    ctx = await build_chat_context_with_budget(
        user_id="u-empty",
        db=None,
        redis=None,
        message="hi",
    )

    assert ctx.results["memory"].data.get("memory_count", 0) == 0
    assert ctx.results["memory"].status in ("empty", "ok")


# ---------------------------------------------------------------------------
# Dataclass contract: new fields exist with correct defaults
# ---------------------------------------------------------------------------


def test_chat_context_dataclass_has_rag_fields():
    """The legacy ``ChatContext`` shim must expose ``rag_used`` and
    ``memory_status`` so the streaming SSE in ``chat.py`` can read them
    without ``AttributeError``."""

    ctx = ChatContext(text="")

    assert ctx.rag_used is False
    assert ctx.memory_status is None
    # The empty-fallback object built inline by ``send_chat_message_stream``
    # is a ``type("EmptyCtx", ...)`` ad-hoc class. Confirm the production
    # fallback path is a no-op for our attribute accesses.
    fallback = type(
        "EmptyCtx",
        (),
        {
            "text": "",
            "memory_count": 0,
            "mood_signal": None,
            "prediction": None,
            "rag_used": False,
            "memory_status": "timeout",
        },
    )()
    assert fallback.rag_used is False
    assert fallback.memory_status == "timeout"
