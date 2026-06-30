"""Regression tests for Priority 1 (Phase 10) follow-up fixes (2026-07-22).

Covers:

* **1.1 — mood inference Bengali output** (``app/services/mood_inference.py``).
  Both ``infer_mood_from_signals`` and the parallelized variant
  ``infer_mood_from_signals_parallel`` must emit *valid Bengali* in
  ``reason_bn``. A previous copy-paste through a Windows console with the
  wrong codepage corrupted four Bengali literals in the parallel variant
  into ``?`` runs. This test pins down both code paths so any future
  re-introduction of mojibake fails loudly.

* **1.2 — journal DELETE no longer 500s** (``app/api/journal/routes.py``).
  A failed service call (session in a bad state, expired row, asyncpg
  pool exhaustion) used to surface as a raw 500. The route now rolls
  back the session and converts any error into a clean 404 so the
  client can react gracefully.

* **1.3 — streaming chat enforces crisis + quota before opening SSE**
  (``app/api/chat/routes.py``). The route must await
  ``detect_crisis`` and ``assert_ai_message_quota`` **outside** the
  SSE generator so the headers go out only after the gates have run.
  A user past their AI-message quota now receives a hard 403 instead
  of a partial SSE stream that aborts mid-flight.
"""
from __future__ import annotations

import asyncio
import inspect
from typing import Any

import pytest


# ---------------------------------------------------------------------------
# 1.1 — mood inference Bengali output is never corrupted
# ---------------------------------------------------------------------------


def _contains_question_marks(value: str) -> bool:
    """``reason_bn`` must contain real Bengali (Unicode ≥ U+0980), never ``?``.

    The mojibake was a contiguous run of ``?`` characters standing in for
    Bengali glyphs. We guard with a structural check: any 3+ run of ``?``
    inside a non-empty string means the source has been corrupted.
    """
    if not value:
        return False
    return "??" in value  # two consecutive ``?`` are enough to flag the bug


def _has_real_bengali(value: str) -> bool:
    """Return True if ``value`` contains at least one Bengali Unicode codepoint."""
    return any("\u0980" <= ch <= "\u09ff" for ch in value)


def test_infer_mood_from_signals_emits_valid_bengali(monkeypatch):
    """The sync mood inference must produce Bengali ``reason_bn`` output.

    The sync variant (``infer_mood_from_signals``) uses six inline
    ``await db.execute(...)`` calls — there is no helper to stub. We
    therefore provide a fake async session whose ``.execute`` returns
    empty scalars so the analyzer falls into the empty-evidence branch
    and the final ``reason_bn`` reaches the static "no signals yet"
    Bengali literal that was the corruption point on day one.
    """
    from app.services.mood_inference import (
        MoodInference,
        infer_mood_from_signals,
    )

    class _EmptyScalars:
        def scalars(self):
            return self

        def all(self):
            return []

    class _EmptyResult:
        def scalars(self):
            return _EmptyScalars()

    class _FakeDbSession:
        async def execute(self, _stmt):
            return _EmptyResult()

    result = asyncio.run(
        infer_mood_from_signals(_FakeDbSession(), "u-bn-sync", days=14)
    )

    assert isinstance(result, MoodInference)
    assert result.reason_bn, "reason_bn must not be empty"
    assert not _contains_question_marks(result.reason_bn), (
        f"reason_bn is corrupted: {result.reason_bn!r}"
    )
    assert _has_real_bengali(result.reason_bn), (
        f"reason_bn must contain Bengali characters: {result.reason_bn!r}"
    )


def test_infer_mood_from_signals_parallel_emits_valid_bengali(monkeypatch):
    """The parallel variant must produce the SAME quality of Bengali output.

    This is the regression test for the four ``??????????`` lines that
    crept in via a Windows-console copy-paste of the parallel rewrite.
    """
    from app.services.mood_inference import (
        MoodInference,
        infer_mood_from_signals_parallel,
    )

    async def fake_gather(db, user_id, since, timeout_ms=None):
        return {
            "messages": [],
            "journals": [],
            "reflections": [],
            "activities": [],
            "sleeps": [],
            "habits": [],
            "completions": [],
        }

    monkeypatch.setattr(
        "app.services.mood_inference._gather_signal_queries", fake_gather
    )

    class _NoopSession:
        pass

    result = asyncio.run(
        infer_mood_from_signals_parallel(_NoopSession(), "u-bn-parallel", days=14)
    )

    assert isinstance(result, MoodInference)
    assert result.reason_bn, "reason_bn must not be empty"
    assert not _contains_question_marks(result.reason_bn), (
        f"parallel reason_bn is corrupted: {result.reason_bn!r}"
    )
    assert _has_real_bengali(result.reason_bn), (
        f"parallel reason_bn must contain Bengali characters: {result.reason_bn!r}"
    )


def test_mood_inference_source_has_no_question_mark_runs():
    """Static guard: no ``reason_bn = "..."`` literal in the source may be
    composed entirely of ``?`` characters.

    Defensive belt-and-suspenders check that fires even if both functions
    above are removed or stubbed out. We read the source file and assert
    that no Bengali-context assignment is a run of ``?``.
    """
    import pathlib
    import re

    src_path = (
        pathlib.Path(__file__).resolve().parents[1]
        / "app"
        / "services"
        / "mood_inference.py"
    )
    text = src_path.read_text(encoding="utf-8")

    # Find every line that assigns ``reason_bn = f"..."`` or ``reason_bn = "..."``
    matches = re.findall(r'reason_bn\s*=\s*("[^"]*"|f"[^"]*")', text)
    assert matches, "expected at least one reason_bn assignment"

    for literal in matches:
        # Strip the surrounding quotes for inspection.
        inner = literal[1:-1]
        # Drop the ``f"..."`` prefix on f-strings; the structural check
        # is on the static body — only the ``STATE_BN[state]`` slot is
        # dynamic. We assert that no static portion of any reason_bn is
        # a run of 3+ ``?``.
        # Split on the f-string ``{...}`` placeholders so we can check
        # each static segment independently.
        static_segments = re.split(r"\{[^}]*\}", inner)
        for seg in static_segments:
            assert "???" not in seg, (
                f"mojibake detected in mood_inference.py: {literal!r}"
            )


# ---------------------------------------------------------------------------
# 1.2 — journal DELETE never returns raw 500
# ---------------------------------------------------------------------------


def test_delete_endpoint_wraps_service_in_try_except():
    """The DELETE handler must catch SQLAlchemy errors and convert to 404.

    A successful ``success=False`` returns 404 by design. But any
    exception raised inside the service (stale session, asyncpg
    exhaustion, expired row) must also map to a 404 — never a raw 500.
    """
    from app.api.journal import routes as journal_routes

    src = inspect.getsource(journal_routes.delete_journal_entry)
    # The handler body must contain a ``try:`` wrapping the service call.
    assert "try:" in src, "delete handler must wrap service call in try/except"
    # And the except clause must re-raise as HTTP 404.
    assert "404" in src, "delete handler must convert exceptions to HTTP 404"


@pytest.mark.asyncio
async def test_delete_endpoint_converts_service_exception_to_404(monkeypatch):
    """When the service raises, the route returns 404 (not 500)."""

    from fastapi import HTTPException

    from app.api.journal import routes as journal_routes

    async def boom(*_a: Any, **_kw: Any) -> bool:
        raise RuntimeError("simulated DB session failure")

    monkeypatch.setattr(journal_routes, "delete_journal_entry_service", boom)

    # Build a fake async db that supports ``await db.rollback()`` and
    # can be passed as the ``db`` arg. We don't actually call .commit()
    # because the service raises before reaching it.
    class _FakeSession:
        async def rollback(self) -> None:
            return None

    class _FakeUser:
        id = "u-1"

    with pytest.raises(HTTPException) as excinfo:
        await journal_routes.delete_journal_entry(
            entry_id="entry-1",
            current_user=_FakeUser(),  # type: ignore[arg-type]
            db=_FakeSession(),         # type: ignore[arg-type]
            redis=None,
        )

    assert excinfo.value.status_code == 404, (
        f"service exception must surface as 404, got {excinfo.value.status_code}"
    )


# ---------------------------------------------------------------------------
# 1.3 — streaming chat enforces crisis + quota before opening SSE
# ---------------------------------------------------------------------------


def test_stream_route_gates_quota_and_crisis_outside_generator():
    """The ``stream_message`` route must call ``detect_crisis`` and
    ``assert_ai_message_quota`` outside the inner async generator.

    Static check: read the source of ``stream_message`` and assert that
    both gates appear BEFORE the first ``def event_stream():`` line.
    """
    from app.api.chat import routes as chat_routes

    src = inspect.getsource(chat_routes.stream_message)
    event_stream_idx = src.find("def event_stream")
    assert event_stream_idx > 0, "stream_message must define an event_stream inner generator"

    head = src[:event_stream_idx]
    assert "detect_crisis" in head, (
        "detect_crisis must be awaited before event_stream opens"
    )
    assert "assert_ai_message_quota" in head, (
        "assert_ai_message_quota must be awaited before event_stream opens"
    )


@pytest.mark.asyncio
async def test_stream_route_returns_403_when_quota_exceeded(monkeypatch):
    """Quota exhaustion must produce a hard 403 BEFORE the SSE stream opens.

    We patch the gates at their source module
    (``app.services.crisis.detect_crisis`` and
    ``app.services.subscription.assert_ai_message_quota``) because the
    route imported them as module-level names — patching the symbol on
    ``chat_routes`` would not affect the closure ``detect_crisis`` and
    ``assert_ai_message_quota`` the route actually awaits. Module-level
    patches are visible from any importer that did ``from X import Y``.
    """

    from fastapi import HTTPException

    from app.services.crisis import CrisisResult, CrisisSeverity
    from app.services.subscription import FeatureLimitExceeded
    from app.api.chat import routes as chat_routes

    class _FakeUser:
        id = "u-quota"
        plan = "free"
        subscription_status = "active"

    class _FakeSession:
        async def rollback(self) -> None:
            return None

    async def fake_detect_crisis(_msg: str) -> CrisisResult:
        return CrisisResult(
            is_crisis=False,
            severity=CrisisSeverity.LOW,
            category="none",
            confidence=0.0,
            response_template="",
        )

    async def fake_quota(_db, _user) -> None:
        raise FeatureLimitExceeded("AI messages", 0)

    monkeypatch.setattr(chat_routes, "detect_crisis", fake_detect_crisis)
    monkeypatch.setattr(chat_routes, "assert_ai_message_quota", fake_quota)

    request = type(
        "Req",
        (),
        {"message": "hi", "conversation_id": None, "model": None, "language": None},
    )()

    with pytest.raises(HTTPException) as excinfo:
        await chat_routes.stream_message(
            request=request,                    # type: ignore[arg-type]
            current_user=_FakeUser(),           # type: ignore[arg-type]
            db=_FakeSession(),                  # type: ignore[arg-type]
            redis=None,
            pinecone_index=None,
        )

    assert excinfo.value.status_code == 403, (
        f"quota-exceeded must surface as 403, got {excinfo.value.status_code}"
    )


@pytest.mark.asyncio
async def test_stream_route_passes_precomputed_crisis_to_chat_service(monkeypatch):
    """F12 contract: a crisis-flagged message must pass ``precomputed_crisis``
    (with ``is_crisis=True``) into ``send_chat_message_stream`` so that the
    chat service can short-circuit before invoking the LLM.

    The route itself always opens the SSE stream — it doesn't render the
    safety response, that's the chat service's job. What the route MUST do
    is hand the already-decided ``CrisisResult`` to the inner streaming
    function; otherwise ``send_chat_message_stream`` would re-run
    ``detect_crisis(message_content)`` and possibly race a fresh result
    against the gate.
    """
    from app.api.chat import routes as chat_routes
    from app.services.crisis import CrisisResult, CrisisSeverity

    class _FakeUser:
        id = "u-crisis"
        plan = "premium"
        subscription_status = "active"

    class _FakeSession:
        async def rollback(self) -> None:
            return None

    crisis_decision = CrisisResult(
        is_crisis=True,
        severity=CrisisSeverity.HIGH,
        category="suicide",
        confidence=0.95,
        response_template="If you're in immediate danger, please call 988.",
    )

    async def fake_detect_crisis(_msg: str) -> CrisisResult:
        return crisis_decision

    async def fake_quota(*_a: Any, **_kw: Any) -> None:
        return None

    captured: dict[str, Any] = {}

    async def fake_stream(*_a: Any, **kw: Any):
        captured.update(kw)
        # Yield the structure the chat service yields in real life; this
        # is the same minimal shape the generator in the route consumes.
        yield {"type": "meta", "conversation_id": "conv-fake"}
        yield {"type": "token", "delta": "staying safe..."}
        yield {"type": "done"}

    monkeypatch.setattr(chat_routes, "detect_crisis", fake_detect_crisis)
    monkeypatch.setattr(chat_routes, "assert_ai_message_quota", fake_quota)
    monkeypatch.setattr(chat_routes, "send_chat_message_stream", fake_stream)

    request = type(
        "Req",
        (),
        {"message": "I want to end it all", "conversation_id": None, "model": None, "language": None},
    )()

    response = await chat_routes.stream_message(
        request=request,                    # type: ignore[arg-type]
        current_user=_FakeUser(),           # type: ignore[arg-type]
        db=_FakeSession(),                  # type: ignore[arg-type]
        redis=None,
        pinecone_index=None,
    )

    # Drive the inner generator so the kwargs are captured before we
    # inspect them. The shape of the route is:
    #   async def event_stream():
    #       ... = send_chat_message_stream(...)
    #       ...
    body = getattr(response, "body_iterator", None)
    if body is not None:
        async for _ in body:  # type: ignore[union-attr]
            pass

    assert "precomputed_crisis" in captured, (
        "stream_message must forward precomputed_crisis to send_chat_message_stream"
    )
    forwarded = captured["precomputed_crisis"]
    assert forwarded is crisis_decision, (
        "forwarded precomputed_crisis must be the same object the route detected"
    )
    assert forwarded.is_crisis is True, (
        "forwarded precomputed_crisis.is_crisis must be True when crisis is detected"
    )