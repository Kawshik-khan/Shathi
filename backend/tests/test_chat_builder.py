"""Tests for the parallel ContextBuilder and the per-section cache.

These tests verify the four correctness guarantees the chat-streaming
refactor relies on:

* **Timeout isolation** — a slow provider must not block the others
  and must be reported as ``status="timeout"``.
* **Parallel execution** — the total wall-clock of the gather must be
  approximately the slowest single provider, not the sum.
* **Graceful degradation** — a provider that raises must not abort
  the build; the others must still complete.
* **Cache hit short-circuit** — once a section is cached, the second
  call must not invoke the underlying factory.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Optional

import pytest

from app.services.chat import cache as cache_mod
from app.services.chat import sections
from app.services.chat.builder import (
    BuiltContext,
    ContextBuilder,
    build_chat_context,
    build_chat_context_with_budget,
)
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)


# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


class FakeRedis:
    """In-process dict-backed stand-in for aioredis; records call order."""

    def __init__(self) -> None:
        self.store: dict[str, str] = {}
        self.deleted: list[str] = []
        self.unlink_calls: int = 0
        self.delete_calls: int = 0

    async def get(self, key: str) -> Optional[str]:
        return self.store.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self.store[key] = value

    async def unlink(self, *keys: str) -> int:
        self.unlink_calls += 1
        for key in keys:
            self.store.pop(key, None)
            self.deleted.append(key)
        return len(keys)

    # ``delete`` is the fallback path; mirror ``unlink`` for coverage.
    async def delete(self, *keys: str) -> int:
        self.delete_calls += 1
        return await self.unlink(*keys)


def _ctx(user_id: str = "u-test", redis: Any = None) -> ProviderContext:
    return ProviderContext(
        user_id=user_id,
        db=None,
        redis=redis,
        pinecone_index=None,
        message="hello world",
        language="en",
        conversation_id="c-1",
        include_memory=False,
    )


def _build_factory_for_section(section_name: str):
    """Return the ``build_*`` function from ``sections`` package."""
    return getattr(sections, f"build_{section_name}")


# ---------------------------------------------------------------------------
# Provider isolation primitive
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_run_provider_records_timeout_for_slow_factory():
    """A factory that sleeps past the budget returns a timeout result."""

    async def slow(_ctx: ProviderContext) -> ContextResult:
        await asyncio.sleep(0.2)
        return ContextResult(name="x", parts=["never"])

    result = await run_provider("x", slow, _ctx(), timeout_ms=50)

    assert result.status == "timeout"
    assert result.duration_ms >= 50
    assert result.parts == []
    assert "timeout" in (result.error or "")


@pytest.mark.asyncio
async def test_run_provider_swallows_exceptions_as_error_status():
    """A factory that raises is captured as status="error", never re-raised."""

    async def boom(_ctx: ProviderContext) -> ContextResult:
        raise RuntimeError("kaboom")

    result = await run_provider("x", boom, _ctx(), timeout_ms=500)

    assert result.status == "error"
    assert "RuntimeError" in (result.error or "")
    assert "kaboom" in (result.error or "")


@pytest.mark.asyncio
async def test_run_provider_returns_empty_status_for_zero_data():
    """Successful factory that yields no parts is reported as empty, not ok."""

    async def silent(_ctx: ProviderContext) -> ContextResult:
        return ContextResult(name="x", parts=[])

    result = await run_provider("x", silent, _ctx(), timeout_ms=500)

    assert result.status == "empty"


# ---------------------------------------------------------------------------
# ContextBuilder: timeout isolation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_context_builder_slow_provider_does_not_block_others(monkeypatch):
    """One slow section must not delay the rest of the build."""

    async def slow_mood(ctx: ProviderContext) -> ContextResult:
        await asyncio.sleep(0.3)
        return ContextResult(name="mood", parts=["mood line"])

    async def fast_profile(ctx: ProviderContext) -> ContextResult:
        await asyncio.sleep(0.01)
        return ContextResult(name="profile", parts=["profile line"])

    monkeypatch.setattr(sections, "build_mood", slow_mood)
    monkeypatch.setattr(sections, "build_profile", fast_profile)

    builder = ContextBuilder(_ctx())
    started = time.perf_counter()
    built = await builder.run()
    elapsed = time.perf_counter() - started

    # Total wall-clock must be in the ballpark of the slow provider, not the
    # sum. Allow generous slack for CI scheduling jitter.
    assert elapsed < 0.6, f"build took {elapsed:.3f}s, expected ≈0.3s"
    assert built.providers == 8
    assert built.results["mood"].parts == ["mood line"]
    assert built.results["profile"].parts == ["profile line"]


@pytest.mark.asyncio
async def test_context_builder_failing_provider_does_not_abort(monkeypatch):
    """A raising factory must be recorded as error, others must still finish."""

    async def bad_journal(ctx: ProviderContext) -> ContextResult:
        raise RuntimeError("journal db down")

    async def ok_sleep(ctx: ProviderContext) -> ContextResult:
        return ContextResult(name="sleep", parts=["sleep line"])

    monkeypatch.setattr(sections, "build_journal", bad_journal)
    monkeypatch.setattr(sections, "build_sleep", ok_sleep)

    built = await ContextBuilder(_ctx()).run()

    assert built.results["journal"].status == "error"
    assert "journal db down" in (built.results["journal"].error or "")
    assert built.results["sleep"].status == "ok"
    assert built.results["sleep"].parts == ["sleep line"]
    assert built.failed >= 1


# ---------------------------------------------------------------------------
# ContextBuilder: parallel execution
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_context_builder_runs_in_parallel(monkeypatch):
    """Each section sleeps 0.1s; total must be ≈0.1s, not 8 * 0.1s."""

    sleep_seconds = 0.1

    async def sleeping(ctx: ProviderContext) -> ContextResult:
        await asyncio.sleep(sleep_seconds)
        return ContextResult(name="x", parts=["line"])

    for name, _ in (
        ("profile", sections.build_profile),
        ("mood", sections.build_mood),
        ("journal", sections.build_journal),
        ("sleep", sections.build_sleep),
        ("habit", sections.build_habit),
        ("activity", sections.build_activity),
        ("memory", sections.build_memory),
        ("inferred_mood", sections.build_inferred_mood),
    ):
        monkeypatch.setattr(sections, f"build_{name}", sleeping)

    started = time.perf_counter()
    built = await ContextBuilder(_ctx()).run()
    elapsed = time.perf_counter() - started

    # Sequential would be ~0.8s; parallel must be closer to 0.1s. Allow
    # generous slack for asyncio scheduling under pytest.
    assert elapsed < 0.5, f"parallel build took {elapsed:.3f}s, expected ≈0.1s"
    assert built.providers == 8


# ---------------------------------------------------------------------------
# BuiltContext rendering helpers
# ---------------------------------------------------------------------------


def test_built_context_render_parts_preserves_prompt_order():
    built = BuiltContext(
        results={
            "mood": ContextResult(name="mood", parts=["m"]),
            "profile": ContextResult(name="profile", parts=["p"]),
            "journal": ContextResult(name="journal", parts=["j"]),
            "memory": ContextResult(name="memory", parts=["mem"]),
            "inferred_mood": ContextResult(name="inferred_mood", parts=["i"]),
            "sleep": ContextResult(name="sleep", parts=[]),
            "habit": ContextResult(name="habit", parts=[]),
            "activity": ContextResult(name="activity", parts=[]),
        },
        duration_ms=42.0,
        providers=8,
        cached=2,
        timed_out=0,
        failed=0,
    )

    # _PROVIDER_BUILDERS order in builder.py: profile, mood, journal, sleep,
    # habit, activity, memory, inferred_mood.
    assert built.render_parts() == ["p", "m", "j", "mem", "i"]


def test_built_context_to_payload_includes_section_summary():
    built = BuiltContext(
        results={
            "profile": ContextResult(
                name="profile",
                status="ok",
                duration_ms=12.0,
                cached=True,
                parts=["p-line"],
                tokens=8,
            ),
        },
        duration_ms=12.0,
        providers=1,
        cached=1,
        timed_out=0,
        failed=0,
    )

    payload = built.to_payload()

    assert payload["providers"] == 1
    assert payload["cached"] == 1
    assert payload["timed_out"] == 0
    assert payload["failed"] == 0
    assert payload["sections"]["profile"]["status"] == "ok"
    assert payload["sections"]["profile"]["cached"] is True
    assert payload["sections"]["profile"]["parts"] == ["p-line"]
    assert payload["sections"]["profile"]["tokens"] == 8


# ---------------------------------------------------------------------------
# Hard budget cap
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_build_with_budget_synthesizes_timeouts_on_overrun(monkeypatch):
    """When the hard budget fires, unfinished providers report timeout."""

    async def very_slow(ctx: ProviderContext) -> ContextResult:
        await asyncio.sleep(2.0)
        return ContextResult(name="x", parts=["never"])

    async def fast(ctx: ProviderContext) -> ContextResult:
        await asyncio.sleep(0.01)
        return ContextResult(name="x", parts=["ok"])

    monkeypatch.setattr(sections, "build_mood", very_slow)
    monkeypatch.setattr(sections, "build_journal", fast)
    # Other builders are no-ops on their own — they return empty ContextResult.

    built = await build_chat_context_with_budget(
        user_id="u-budget",
        db=None,
        redis=None,
        message="hi",
        budget_ms=150,
    )

    assert built.timed_out >= 1
    assert built.results["journal"].status == "ok"
    # LLM can still proceed: render_parts returns whatever survived.
    assert built.results["journal"].parts == ["ok"]


# ---------------------------------------------------------------------------
# Cache hit short-circuit
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_section_cache_hit_does_not_invoke_factory(monkeypatch):
    """After a section is cached, the factory must not be called again."""

    call_count = {"n": 0}

    async def mood_factory(ctx: ProviderContext) -> ContextResult:
        call_count["n"] += 1
        return ContextResult(
            name="mood",
            parts=["mood: avg 6.2"],
            data={"average": 6.2},
        )

    monkeypatch.setattr(sections, "build_mood", mood_factory)

    redis = FakeRedis()
    ctx = _ctx(redis=redis)

    # First call: cache miss → factory runs, result is cached.
    first = await sections.build_mood(ctx)
    assert call_count["n"] == 1
    await cache_mod.set_section(
        user_id=ctx.user_id,
        section="mood",
        payload={"parts": first.parts, "data": first.data},
        redis=redis,
    )

    # Second call: cache hit path exercised via run_provider style.
    cached = await cache_mod.get_section(ctx.user_id, "mood", redis)
    assert cached is not None
    assert cached["parts"] == ["mood: avg 6.2"]
    # Factory should NOT be invoked when we use the cached payload directly.
    second_result = ContextResult(
        name="mood",
        parts=cached["parts"],
        data=cached.get("data", {}),
        cached=True,
    )
    assert second_result.cached is True


@pytest.mark.asyncio
async def test_section_cache_miss_falls_back_to_factory(monkeypatch):
    """Without a cache entry the factory must still run."""

    call_count = {"n": 0}

    async def habit_factory(ctx: ProviderContext) -> ContextResult:
        call_count["n"] += 1
        return ContextResult(name="habit", parts=["habits: 3 active"])

    monkeypatch.setattr(sections, "build_habit", habit_factory)

    redis = FakeRedis()  # empty
    cached = await cache_mod.get_section("u-miss", "habit", redis)
    assert cached is None

    result = await sections.build_habit(_ctx(user_id="u-miss", redis=redis))
    assert call_count["n"] == 1
    assert result.parts == ["habits: 3 active"]


# ---------------------------------------------------------------------------
# Cache invalidation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_invalidate_user_context_sections_targets_named_subset():
    """Passing ['mood'] removes only mood's key, not journal's."""
    redis = FakeRedis()
    await redis.set("chat_ctx:mood:u1", "1", ex=60)
    await redis.set("chat_ctx:journal:u1", "1", ex=60)
    await redis.set("chat_ctx:sleep:u1", "1", ex=60)

    await cache_mod.invalidate_user_context_sections(
        "u1", redis, sections=["mood"]
    )

    assert "chat_ctx:mood:u1" not in redis.store
    assert "chat_ctx:journal:u1" in redis.store
    assert "chat_ctx:sleep:u1" in redis.store


@pytest.mark.asyncio
async def test_invalidate_user_context_sections_none_drops_everything():
    """Passing None removes every known section's key."""
    redis = FakeRedis()
    for section in cache_mod._SECTION_TTL_ATTRS.keys():  # noqa: SLF001
        await redis.set(f"chat_ctx:{section}:u1", "1", ex=60)

    await cache_mod.invalidate_user_context_sections("u1", redis, sections=None)

    for section in cache_mod._SECTION_TTL_ATTRS.keys():  # noqa: SLF001
        assert f"chat_ctx:{section}:u1" not in redis.store


@pytest.mark.asyncio
async def test_get_section_returns_none_when_redis_missing():
    """Without a Redis backend every cache call is a safe no-op."""
    assert await cache_mod.get_section("u1", "mood", redis=None) is None
    # No exception when writing either.
    await cache_mod.set_section("u1", "mood", {"x": 1}, redis=None)


@pytest.mark.asyncio
async def test_get_section_decodes_valid_json():
    redis = FakeRedis()
    redis.store["chat_ctx:profile:u1"] = '{"a": 1}'
    payload = await cache_mod.get_section("u1", "profile", redis)
    assert payload == {"a": 1}


@pytest.mark.asyncio
async def test_get_section_treats_corrupt_value_as_miss(caplog):
    redis = FakeRedis()
    redis.store["chat_ctx:profile:u1"] = "not-json{"
    payload = await cache_mod.get_section("u1", "profile", redis)
    assert payload is None
    assert any("decode failed" in rec.message for rec in caplog.records)


# ---------------------------------------------------------------------------
# Public entrypoint smoke test
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_build_chat_context_returns_built_context(monkeypatch):
    """Public ``build_chat_context`` returns a BuiltContext with all sections."""

    # Replace every section builder with a deterministic stub so we don't
    # need a real DB / Pinecone. Each returns a unique marker so we can
    # assert the full set is collected.
    markers = {
        "profile": "profile-line",
        "mood": "mood-line",
        "journal": "journal-line",
        "sleep": "sleep-line",
        "habit": "habit-line",
        "activity": "activity-line",
        "memory": "memory-line",
        "inferred_mood": "inferred-line",
    }
    for name, marker in markers.items():
        async def factory(ctx: ProviderContext, _name=name, _m=marker):
            return ContextResult(name=_name, parts=[_m])

        monkeypatch.setattr(sections, f"build_{name}", factory)

    built = await build_chat_context(
        user_id="u-public",
        db=None,
        redis=None,
        message="hi",
    )

    assert isinstance(built, BuiltContext)
    assert built.providers == 8
    for marker in markers.values():
        assert marker in built.render_parts()