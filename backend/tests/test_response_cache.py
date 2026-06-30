import asyncio

import app.services.response_cache as rc


class FakeIndex:
    """Minimal fake Pinecone index recording calls and returning canned matches."""

    def __init__(self, matches=None, raise_on=None):
        self._matches = matches or []
        self._raise_on = raise_on or set()
        self.query_calls = []
        self.upsert_calls = []

    def query(self, **kwargs):
        if "query" in self._raise_on:
            raise RuntimeError("boom")
        self.query_calls.append(kwargs)
        # Filter by user_id to emulate per-user isolation
        user_id = (kwargs.get("filter") or {}).get("user_id")
        matches = [
            m for m in self._matches
            if m.get("metadata", {}).get("user_id") == user_id
        ]
        return {"matches": matches}

    def upsert(self, **kwargs):
        if "upsert" in self._raise_on:
            raise RuntimeError("boom")
        self.upsert_calls.append(kwargs)


def _patch_embedding(monkeypatch):
    async def fake_embedding(_text):
        return [0.1] * rc.settings.EMBEDDING_DIM

    monkeypatch.setattr(rc, "generate_embedding", fake_embedding)


def test_lookup_returns_reply_on_high_score(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", True)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_SIMILARITY_THRESHOLD", 0.95)
    index = FakeIndex(matches=[
        {"score": 0.97, "metadata": {"user_id": "u1", "reply": "cached hi"}},
    ])

    result = asyncio.run(rc.lookup_cached_response("u1", "hello", index))

    assert result == "cached hi"
    assert index.query_calls[0]["namespace"] == rc.settings.RESPONSE_CACHE_NAMESPACE
    assert index.query_calls[0]["filter"] == {"user_id": "u1"}


def test_lookup_returns_none_below_threshold(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", True)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_SIMILARITY_THRESHOLD", 0.95)
    index = FakeIndex(matches=[
        {"score": 0.80, "metadata": {"user_id": "u1", "reply": "cached hi"}},
    ])

    assert asyncio.run(rc.lookup_cached_response("u1", "hello", index)) is None


def test_lookup_is_per_user(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", True)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_SIMILARITY_THRESHOLD", 0.95)
    index = FakeIndex(matches=[
        {"score": 0.99, "metadata": {"user_id": "u1", "reply": "user-a reply"}},
    ])

    # User B must not receive user A's cached reply.
    assert asyncio.run(rc.lookup_cached_response("u2", "hello", index)) is None


def test_lookup_disabled_returns_none(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", False)
    index = FakeIndex(matches=[
        {"score": 0.99, "metadata": {"user_id": "u1", "reply": "cached"}},
    ])

    assert asyncio.run(rc.lookup_cached_response("u1", "hello", index)) is None
    assert index.query_calls == []


def test_lookup_no_index_returns_none(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", True)
    assert asyncio.run(rc.lookup_cached_response("u1", "hello", None)) is None


def test_lookup_fails_open_on_error(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", True)
    index = FakeIndex(raise_on={"query"})

    assert asyncio.run(rc.lookup_cached_response("u1", "hello", index)) is None


def test_store_upserts_with_namespace_and_metadata(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", True)
    index = FakeIndex()

    asyncio.run(rc.store_cached_response("u1", "hello", "hi there", index))

    assert len(index.upsert_calls) == 1
    call = index.upsert_calls[0]
    assert call["namespace"] == rc.settings.RESPONSE_CACHE_NAMESPACE
    metadata = call["vectors"][0]["metadata"]
    assert metadata["user_id"] == "u1"
    assert metadata["reply"] == "hi there"


def test_store_disabled_is_noop(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", False)
    index = FakeIndex()

    asyncio.run(rc.store_cached_response("u1", "hello", "hi there", index))

    assert index.upsert_calls == []


def test_store_fails_open_on_error(monkeypatch):
    _patch_embedding(monkeypatch)
    monkeypatch.setattr(rc.settings, "RESPONSE_CACHE_ENABLED", True)
    index = FakeIndex(raise_on={"upsert"})

    # Should not raise
    asyncio.run(rc.store_cached_response("u1", "hello", "hi there", index))
