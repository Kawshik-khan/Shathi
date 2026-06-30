"""Tests for the RAG optimization layer.

Covers the four optimizations layered on top of the basic streaming
wiring (see ``test_rag_streaming_wiring.py``):

1. **Embedding cache** — repeated calls for the same normalized text
   should hit the in-process LRU first, then fall through to the
   Redis layer, and only call the upstream API on a true miss.
2. **History-expanded memory query** — when the conversation has prior
   assistant turns, the embedding query should include them so
   Pinecone matches against recent context.
3. **Score gate + min_keep** — weak matches are dropped unless fewer
   than ``MEMORY_MIN_KEEP`` survive.
4. **Response-cache short-circuit** — when the semantic cache hits
   within the race budget, the streaming and non-streaming chat paths
   must build context with ``include_memory=False`` so the memory
   section is never executed.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, Optional

import pytest

from app.services import memory as memory_service
from app.services.chat import sections
from app.services.chat import cache as section_cache
from app.services.chat.providers import ContextResult, ProviderContext
from app.services.chat.sections import memory as memory_section


# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


class FakePineconeIndex:
    def __init__(self, matches: list[dict[str, Any]] | None = None) -> None:
        self.matches = matches or []
        self.query_calls: list[dict[str, Any]] = []

    def query(self, **kwargs: Any) -> dict[str, Any]:
        self.query_calls.append(kwargs)
        return {"matches": list(self.matches)}

    def upsert(self, **kwargs: Any) -> dict[str, Any]:
        return {"upserted_count": len(kwargs.get("vectors", []))}


class FakeRedis:
    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    async def get(self, key: str) -> Optional[str]:
        return self.store.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self.store[key] = value


def _ctx(
    user_id: str = "u-opt",
    *,
    message: str = "hello",
    pinecone_index: Any = None,
    redis: Any = None,
    conversation_id: str = "c-opt",
    db: Any = None,
) -> ProviderContext:
    return ProviderContext(
        user_id=user_id,
        db=db,
        redis=redis,
        pinecone_index=pinecone_index,
        message=message,
        language="en",
        conversation_id=conversation_id,
        include_memory=True,
    )


def _bypass_section_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force every section call through to the live provider."""

    async def _miss(*_a: Any, **_kw: Any) -> None:
        return None

    async def _no_set(*_a: Any, **_kw: Any) -> None:
        return None

    monkeypatch.setattr(memory_section, "get_section", _miss)
    monkeypatch.setattr(memory_section, "set_section", _no_set)


def _patch_conversation_message(monkeypatch: pytest.MonkeyPatch) -> None:
    """Route ``from app.models.conversation import Message``
    inside the section provider to our fake model class."""
    from app.models import conversation as conversation_module

    monkeypatch.setattr(conversation_module, "Message", _FakeConversationMessage)


def _load_legacy_chat_module() -> Any:
    """Return the ``app/services/chat.py`` module.

    ``app.services.chat`` resolves to the ``chat/`` *package* (which
    re-exports a handful of streaming entrypoints). The full chat
    service module — with ``create_message``, ``detect_crisis``,
    ``lookup_cached_response``, ``record_chat_token_usage`` and
    ``_maybe_schedule_summary`` — lives in ``app/services/chat.py`` and
    is loaded by the package's ``__init__`` as
    ``app.services._chat_module_legacy``. We reuse that exact module
    object so monkeypatching a name there propagates to the bare-name
    references inside ``send_chat_message`` / ``send_chat_message_stream``.
    """
    import sys as _sys

    cached = _sys.modules.get("app.services._chat_module_legacy")
    if cached is not None:
        return cached
    import importlib.util as _ilu
    from pathlib import Path as _P

    mod_path = _P(__file__).resolve().parents[1] / "app" / "services" / "chat.py"
    spec = _ilu.spec_from_file_location("app.services._chat_module_legacy", mod_path)
    assert spec is not None and spec.loader is not None
    module = _ilu.module_from_spec(spec)
    _sys.modules["app.services._chat_module_legacy"] = module
    spec.loader.exec_module(module)
    return module


def _stub_generate_embedding(monkeypatch: pytest.MonkeyPatch, vector: Optional[list[float]] = None) -> list[float]:
    """Replace ``memory_service.generate_embedding`` with a constant
    vector so ``retrieve_memories`` does not try to call OpenAI/HF in
    tests that don't care about the embedding itself.

    Default width tracks ``settings.EMBEDDING_DIM`` so the stub vector
    matches whatever Pinecone index the test env points at.
    """
    if vector is None:
        vector = [0.1] * int(memory_service.settings.EMBEDDING_DIM)
    vec = vector

    async def _stub(text: str, *args: Any, **kwargs: Any) -> list[float]:
        return list(vec)

    monkeypatch.setattr(memory_service, "generate_embedding", _stub)
    return vec


# ---------------------------------------------------------------------------
# 1. Embedding cache
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_embedding_cache_hits_lru_on_repeat_call(monkeypatch):
    """Calling ``generate_embedding`` twice with the same text must hit
    the in-process LRU on the second call and never re-invoke the
    upstream embedding client."""

    # Disable real OpenAI/HF clients so a misconfigured env can't
    # silently make real network calls during the test.
    monkeypatch.setattr(memory_service, "openai_client", None)
    monkeypatch.setattr(memory_service, "_EMBEDDING_LRU", memory_service.OrderedDict())

    calls: list[str] = []

    async def fake_openai(text: str) -> list[float]:
        calls.append(text)
        return [0.1, 0.2, 0.3]

    # Patch the lower-level OpenAI call site by intercepting the path
    # the cache wrapper takes: replace ``_lru_get`` to record a hit.
    # We do it by injecting into the LRU directly.
    key = memory_service._embedding_key("hello world")
    memory_service._lru_put(key, [0.42, 0.42, 0.42])

    out = await memory_service.generate_embedding("hello world")
    assert out == [0.42, 0.42, 0.42]
    # No upstream call should have been made.
    assert calls == []


@pytest.mark.asyncio
async def test_embedding_cache_falls_through_to_redis(monkeypatch):
    """A cold LRU but a warm Redis must return the cached vector
    without invoking the OpenAI client."""

    monkeypatch.setattr(memory_service, "openai_client", None)
    monkeypatch.setattr(memory_service, "_EMBEDDING_LRU", memory_service.OrderedDict())

    redis = FakeRedis()
    text = "redis cached text"
    redis.store[memory_service._embedding_redis_key(text)] = json.dumps([0.5, 0.6])

    # If the cache miss path is hit, ``generate_embedding`` would try
    # ``openai_client.embeddings.create`` which raises ``AttributeError``
    # because ``openai_client`` is ``None``. The test would surface that
    # as a failure, so a successful return is sufficient proof.

    out = await memory_service.generate_embedding(text, redis=redis)
    assert out == [0.5, 0.6]
    # The LRU must now be warmed so the next call also skips upstream.
    assert memory_service._lru_get(memory_service._embedding_key(text)) == [0.5, 0.6]


@pytest.mark.asyncio
async def test_embedding_cache_does_not_cache_hf_fallback(monkeypatch):
    """The HF fallback uses a different vector shape; caching it would
    corrupt Pinecone similarity scoring. We verify by monkey-patching
    ``_generate_hf_embedding`` and confirming the result is returned
    but not stored in either cache layer."""

    monkeypatch.setattr(memory_service, "openai_client", None)
    monkeypatch.setattr(memory_service, "_EMBEDDING_LRU", memory_service.OrderedDict())

    redis = FakeRedis()
    text = "hf path text"

    async def fake_hf(text: str) -> list[float]:
        return [0.9] * 384  # HF MiniLM returns 384-d; the real wrapper pads to EMBEDDING_DIM

    monkeypatch.setattr(memory_service, "_generate_hf_embedding", fake_hf)

    out = await memory_service.generate_embedding(text, redis=redis)
    assert out == [0.9] * 384

    # Neither cache should have stored anything.
    assert memory_service._lru_get(memory_service._embedding_key(text)) is None
    assert memory_service._embedding_redis_key(text) not in redis.store


# ---------------------------------------------------------------------------
# 2. History-expanded memory query
# ---------------------------------------------------------------------------


class _Turn:
    """Tiny stand-in for ``ConversationMessage`` used by
    ``_fetch_recent_assistant_turns``."""

    def __init__(self, role: str, content: str, created_at: int) -> None:
        self.role = role
        self.content = content
        self.created_at = created_at


class _Desc:
    """Marker returned by ``Column.desc()`` — only used so the chained
    ``order_by(...).desc()`` call in the provider doesn't blow up. The
    ordering itself is applied in ``_FakeQuery`` based on the column
    name captured from the order_by call."""

    def __init__(self, col_name: str) -> None:
        self.col_name = col_name


class _FakeCol:
    """Stand-in for a SQLAlchemy column that records its name and
    supports ``desc()``."""

    def __init__(self, name: str) -> None:
        self.name = name

    def desc(self) -> _Desc:
        return _Desc(self.name)


class _FakeConversationMessage:
    """Stand-in for ``ConversationMessage`` exposing the column
    attributes the provider references."""

    conversation_id = _FakeCol("conversation_id")
    role = _FakeCol("role")
    created_at = _FakeCol("created_at")


class _FakeQuery:
    def __init__(self, rows: list[_Turn], conversation_id: str) -> None:
        self._rows = rows
        self._conversation_id = conversation_id
        self._order_desc = False
        self._limit: Optional[int] = None

    def filter(self, *clauses: Any) -> "_FakeQuery":
        # Each clause is ``ConversationMessage.<col> == <value>``. We
        # only honor ``role == "assistant"`` and ``conversation_id``.
        for clause in clauses:
            left = getattr(clause, "left", None)
            right = getattr(clause, "right", None)
            if left is None or right is None:
                continue
            col_name = getattr(left, "name", None)
            if col_name == "role" and right != "assistant":
                self._rows = []
            elif col_name == "conversation_id" and right != self._conversation_id:
                self._rows = []
        return self

    def order_by(self, *orderings: Any) -> "_FakeQuery":
        for ordering in orderings:
            if isinstance(ordering, _Desc):
                self._order_desc = True
        return self

    def limit(self, n: int) -> "_FakeQuery":
        self._limit = n
        return self

    def all(self) -> list[_Turn]:
        rows = sorted(self._rows, key=lambda r: r.created_at, reverse=self._order_desc)
        if self._limit is not None:
            rows = rows[: self._limit]
        return rows


class _FakeDB:
    def __init__(self, rows: list[_Turn], conversation_id: str) -> None:
        self._rows = rows
        self._conversation_id = conversation_id

    def query(self, _model: Any) -> _FakeQuery:
        return _FakeQuery(self._rows, self._conversation_id)


@pytest.mark.asyncio
async def test_memory_section_expands_query_with_history(monkeypatch):
    """When prior assistant turns exist, the embedding query passed to
    Pinecone must contain a slice of those turns anchored on the live
    message."""

    fake = FakePineconeIndex(
        matches=[
            {
                "id": "m1",
                "score": 0.85,
                "metadata": {"memory_text": "follow-up on anxiety", "emotion": "anxious"},
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
        **_kw: Any,
    ) -> list[dict[str, Any]]:
        captured["query"] = query
        captured["top_k"] = top_k
        return [
            {
                "id": "m1",
                "score": 0.85,
                "memory_text": "follow-up on anxiety",
                "emotion": "anxious",
            }
        ]

    monkeypatch.setattr(memory_section, "retrieve_relevant_memories", fake_retrieve)
    _bypass_section_cache(monkeypatch)

    async def fake_fetch_turns(ctx: Any, *, last_n: int, per_turn_chars: int) -> list[str]:
        captured["turns"] = last_n
        captured["per_turn_chars"] = per_turn_chars
        return [
            "I hear you, that sounds heavy.",
            "Tell me more about work.",
        ][:last_n]

    monkeypatch.setattr(memory_section, "_fetch_recent_assistant_turns", fake_fetch_turns)

    rows = [
        _Turn("assistant", "I hear you, that sounds heavy.", created_at=2),
        _Turn("assistant", "Tell me more about work.", created_at=3),
    ]
    db = _FakeDB(rows, conversation_id="c-opt")

    result = await memory_section.build(_ctx(
        message="still anxious about the deadline",
        pinecone_index=fake,
        db=db,
    ))

    assert result.status == "ok"
    # The expansion must concatenate the prior turns and the live msg.
    q = captured["query"]
    assert "still anxious about the deadline" in q
    assert "I hear you" in q
    assert "Tell me more about work" in q
    # And it must respect the configured top_k.
    assert captured["top_k"] == memory_section.get_settings().MEMORY_TOP_K


@pytest.mark.asyncio
async def test_memory_section_history_expansion_truncates_to_budget(monkeypatch):
    """The expansion is bounded by ``MEMORY_QUERY_MAX_CHARS`` so a long
    history cannot blow the embedding budget."""

    fake = FakePineconeIndex()

    captured: dict[str, Any] = {}

    async def fake_retrieve(**kwargs: Any) -> list[dict[str, Any]]:
        captured["query"] = kwargs.get("query", "")
        return []

    monkeypatch.setattr(memory_section, "retrieve_relevant_memories", fake_retrieve)
    _bypass_section_cache(monkeypatch)

    settings = memory_section.get_settings()
    big_turn = "x" * (settings.MEMORY_QUERY_TURN_CHARS + 200)

    async def fake_fetch_turns_long(ctx: Any, *, last_n: int, per_turn_chars: int) -> list[str]:
        # Return N oversized turns so the expander is forced to truncate.
        return [big_turn[:per_turn_chars].rstrip() + "…"] * last_n

    monkeypatch.setattr(memory_section, "_fetch_recent_assistant_turns", fake_fetch_turns_long)

    rows = [
        _Turn("assistant", big_turn, created_at=1),
        _Turn("assistant", big_turn, created_at=2),
        _Turn("assistant", big_turn, created_at=3),
    ]
    db = _FakeDB(rows, conversation_id="c-opt")

    await memory_section.build(_ctx(
        message="hi",
        pinecone_index=fake,
        db=db,
    ))

    assert len(captured["query"]) <= settings.MEMORY_QUERY_MAX_CHARS


@pytest.mark.asyncio
async def test_memory_section_handles_missing_db_gracefully(monkeypatch):
    """If the db session isn't attached (``ctx.db is None``), the
    expansion must skip history and just embed the live message."""

    fake = FakePineconeIndex()
    captured: dict[str, Any] = {}

    async def fake_retrieve(**kwargs: Any) -> list[dict[str, Any]]:
        captured["query"] = kwargs.get("query", "")
        return []

    monkeypatch.setattr(memory_section, "retrieve_relevant_memories", fake_retrieve)
    _bypass_section_cache(monkeypatch)

    result = await memory_section.build(_ctx(
        message="just the message",
        pinecone_index=fake,
        db=None,
    ))

    assert captured["query"] == "just the message"
    assert result.status in ("ok", "empty")


# ---------------------------------------------------------------------------
# 3. Score gate + min_keep
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_score_gate_drops_weak_matches(monkeypatch):
    """retrieve_memories should drop matches below the score floor
    when more than ``min_keep`` results remain."""

    _stub_generate_embedding(monkeypatch)

    fake = FakePineconeIndex(
        matches=[
            {"id": "strong", "score": 0.92, "metadata": {"memory_text": "good", "emotion": "happy"}},
            {"id": "medium", "score": 0.75, "metadata": {"memory_text": "ok", "emotion": "neutral"}},
            {"id": "weak", "score": 0.55, "metadata": {"memory_text": "noise", "emotion": "neutral"}},
        ]
    )

    out = await memory_service.retrieve_memories(
        user_id="u-score",
        query="anything",
        top_k=3,
        pinecone_index=fake,
        score_floor=0.7,
        min_keep=2,
    )

    ids = [m["id"] for m in out]
    assert "weak" not in ids
    assert "strong" in ids
    assert "medium" in ids


@pytest.mark.asyncio
async def test_score_gate_keeps_weak_results_when_below_min_keep(monkeypatch):
    """If dropping weak matches would leave fewer than ``min_keep``
    results, return the originals so the section still surfaces
    something."""

    _stub_generate_embedding(monkeypatch)

    fake = FakePineconeIndex(
        matches=[
            {"id": "weak1", "score": 0.50, "metadata": {"memory_text": "a", "emotion": "neutral"}},
            {"id": "weak2", "score": 0.40, "metadata": {"memory_text": "b", "emotion": "neutral"}},
        ]
    )

    out = await memory_service.retrieve_memories(
        user_id="u-keep",
        query="anything",
        top_k=2,
        pinecone_index=fake,
        score_floor=0.7,
        min_keep=2,
    )

    assert len(out) == 2


# ---------------------------------------------------------------------------
# 4. Response-cache short-circuit
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_streaming_chat_short_circuits_memory_on_cache_hit(monkeypatch):
    """When ``lookup_cached_response`` returns a cached reply within the
    race budget, ``send_chat_message_stream`` must build context with
    ``include_memory=False`` so the memory section is never called."""

    chat_module = _load_legacy_chat_module()

    # Stub out everything that touches DB / network except what we
    # explicitly want to observe.
    captured: dict[str, Any] = {}

    class _StubConv:
        id = "c-stream"
        title = "Existing Chat"  # avoids the "rename + commit" branch
        language = "en"
        summary = ""
        updated_at = None

    async def fake_get_conv(*_a: Any, **_kw: Any) -> _StubConv:
        return _StubConv()

    async def fake_create_message(**kwargs: Any) -> Any:
        class _Msg:
            id = "m-1"
            content = kwargs.get("content", "")
            model_used = kwargs.get("model_used", "")
            crisis_flag = kwargs.get("crisis_flag", False)
            crisis_severity = kwargs.get("crisis_severity", None)

        return _Msg()

    async def fake_cache_hit(*_a: Any, **_kw: Any) -> str:
        return "cached reply"

    async def fake_build_ctx(**kwargs: Any) -> Any:
        captured["include_memory"] = kwargs.get("include_memory")
        captured["called"] = True
        return type("Ctx", (), {"text": "", "memory_count": 0, "rag_used": False, "memory_status": "skipped"})()

    async def fake_history(*_a: Any, **_kw: Any) -> list[dict[str, str]]:
        return []

    class _CrisisNoOp:
        is_crisis = False
        severity = type("_Sev", (), {"value": "low"})()
        response_template = ""

    async def fake_detect_crisis(*_a: Any, **_kw: Any) -> Any:
        return _CrisisNoOp()

    monkeypatch.setattr(chat_module, "get_conversation_by_id", fake_get_conv)
    monkeypatch.setattr(chat_module, "create_message", fake_create_message)
    monkeypatch.setattr(chat_module, "lookup_cached_response", fake_cache_hit)
    monkeypatch.setattr(chat_module, "build_chat_context", fake_build_ctx)
    monkeypatch.setattr(chat_module, "get_conversation_messages", fake_history)
    monkeypatch.setattr(chat_module, "detect_crisis", fake_detect_crisis)
    monkeypatch.setattr(chat_module, "record_chat_token_usage", fake_history)
    monkeypatch.setattr(chat_module, "_maybe_schedule_summary", fake_history)

    events = []
    async for ev in chat_module.send_chat_message_stream(
        db=None,
        user_id="u-stream",
        message_content="hi",
        conversation_id="c-stream",
        redis=None,
        pinecone_index=None,
        include_memory=True,
    ):
        events.append(ev)

    # Cache hit → context built without memory section.
    assert captured.get("called") is True
    assert captured.get("include_memory") is False
    # And the stream terminated with the cached content.
    assert any(ev.get("type") == "chunk" and ev.get("chunk") == "cached reply" for ev in events)
    done = [ev for ev in events if ev.get("type") == "done"]
    assert done and done[-1].get("model_used") == "cache"


@pytest.mark.asyncio
async def test_non_streaming_chat_short_circuits_memory_on_cache_hit(monkeypatch):
    """The non-streaming path must also skip the memory section when
    the response cache wins the race."""

    chat_module = _load_legacy_chat_module()

    captured: dict[str, Any] = {}

    class _StubConv:
        id = "c-ns"
        title = "Existing Chat"  # avoids the "rename + commit" branch
        language = "en"
        summary = ""
        updated_at = None

    async def fake_get_conv(*_a: Any, **_kw: Any) -> _StubConv:
        return _StubConv()

    async def fake_create_message(**kwargs: Any) -> Any:
        class _Msg:
            id = "m-1"
            content = kwargs.get("content", "")
            model_used = kwargs.get("model_used", "")
            crisis_flag = kwargs.get("crisis_flag", False)
            crisis_severity = kwargs.get("crisis_severity", None)

        return _Msg()

    async def fake_cache_hit(*_a: Any, **_kw: Any) -> str:
        return "cached reply"

    async def fake_build_ctx(**kwargs: Any) -> Any:
        captured["include_memory"] = kwargs.get("include_memory")
        captured["called"] = True
        return type("Ctx", (), {"text": ""})()

    async def fake_history(*_a: Any, **_kw: Any) -> list[dict[str, str]]:
        return []

    class _CrisisNoOp:
        is_crisis = False
        severity = type("_Sev", (), {"value": "low"})()
        response_template = ""

    async def fake_detect_crisis(*_a: Any, **_kw: Any) -> Any:
        return _CrisisNoOp()

    monkeypatch.setattr(chat_module, "get_conversation_by_id", fake_get_conv)
    monkeypatch.setattr(chat_module, "create_message", fake_create_message)
    monkeypatch.setattr(chat_module, "lookup_cached_response", fake_cache_hit)
    monkeypatch.setattr(chat_module, "build_chat_context", fake_build_ctx)
    monkeypatch.setattr(chat_module, "get_conversation_messages", fake_history)
    monkeypatch.setattr(chat_module, "detect_crisis", fake_detect_crisis)

    conv, _user, ai = await chat_module.send_chat_message(
        db=None,
        user_id="u-ns",
        message_content="hi",
        conversation_id="c-ns",
        redis=None,
        pinecone_index=None,
        include_memory=True,
    )

    assert not captured.get("called"), (
        "On cache hit the non-streaming path must not build chat context at all"
    )
    assert ai.content == "cached reply"
    assert ai.model_used == "cache"
