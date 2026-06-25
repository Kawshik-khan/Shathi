"""ContextBuilder — orchestrates all section providers in parallel.

The legacy ``build_chat_context`` was a single async function that
fetched every section sequentially inside one ``asyncio.timeout(5.0)``
budget. ``ContextBuilder.run`` replaces it with a fan-out:

* All providers start at the same time.
* Each provider has its own budget (``CHAT_PROVIDER_TIMEOUT_MS``).
* A slow/failing provider cannot delay the others, and cannot abort
  the request.
* No outer timeout on the gather — the LLM call decides when to give
  up. The hard ceiling (``CHAT_CONTEXT_HARD_BUDGET_MS``) is enforced
  by ``run_with_hard_budget`` which returns whatever sections have
  completed, never raising.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Optional

from app.core.config import get_settings
from app.services.chat import sections
from app.services.chat.providers import (
    ContextResult,
    ProviderContext,
    run_provider,
)

logger = logging.getLogger(__name__)


# Stable factory map. Order is the prompt-rendering order; parallel
# execution makes the order irrelevant for performance but it makes
# logs easier to read.
_PROVIDER_BUILDERS = [
    "profile",
    "mood",
    "journal",
    "sleep",
    "habit",
    "activity",
    "memory",
    "inferred_mood",
]


def _resolve_factory(name: str):
    """Resolve the section factory by attribute name.

    Resolving at invocation time (instead of capturing the function
    reference at import) lets tests
    ``monkeypatch.setattr(app.services.chat.sections, "build_X", ...)``
    take effect on the next build.
    """
    factory = getattr(sections, f"build_{name}", None)
    if factory is None:
        raise RuntimeError(f"Unknown section factory: {name}")
    return factory


@dataclass
class BuiltContext:
    """Aggregate context ready for prompt composition."""

    results: dict[str, ContextResult] = field(default_factory=dict)
    duration_ms: float = 0.0
    providers: int = 0
    cached: int = 0
    timed_out: int = 0
    failed: int = 0

    @property
    def ok(self) -> bool:
        return self.failed == 0 and self.timed_out == 0

    def render_parts(self) -> list[str]:
        """Prompt-ready lines, ordered for stable rendering."""
        lines: list[str] = []
        for name in _PROVIDER_BUILDERS:
            result = self.results.get(name)
            if not result or not result.parts:
                continue
            lines.extend(result.parts)
        return lines

    def to_payload(self) -> dict[str, Any]:
        """Compact JSON for the response SSE ``meta.context`` event."""
        return {
            "duration_ms": round(self.duration_ms, 1),
            "providers": self.providers,
            "cached": self.cached,
            "timed_out": self.timed_out,
            "failed": self.failed,
            "sections": {
                name: {
                    "status": result.status,
                    "cached": result.cached,
                    "duration_ms": round(result.duration_ms, 1),
                    "tokens": result.tokens,
                    "parts": result.parts,
                }
                for name, result in self.results.items()
            },
        }


class ContextBuilder:
    """Run all providers in parallel and aggregate their results."""

    def __init__(self, ctx: ProviderContext) -> None:
        self.ctx = ctx

    async def run(self) -> BuiltContext:
        return await self._run_all()

    async def _run_all(self) -> BuiltContext:
        started = time.perf_counter()
        # Each factory call is wrapped in ``run_provider`` so a buggy or
        # raising factory is recorded as ``status="error"`` instead of
        # bubbling out of ``asyncio.gather``. Per-provider timeouts
        # (``CHAT_PROVIDER_TIMEOUT_MS``) are also enforced here so a
        # single slow source cannot stall the others.
        results = await asyncio.gather(
            *(
                run_provider(name, _resolve_factory(name), self.ctx)
                for name in _PROVIDER_BUILDERS
            )
        )
        duration_ms = (time.perf_counter() - started) * 1000.0

        built = BuiltContext(duration_ms=duration_ms)
        for name, result in zip(_PROVIDER_BUILDERS, results):
            built.results[name] = result
            built.providers += 1
            if result.cached:
                built.cached += 1
            if result.status == "timeout":
                built.timed_out += 1
            elif result.status == "error":
                built.failed += 1

        logger.info(
            "Context Build Complete Duration=%.1fms Providers=%d Cached=%d "
            "TimedOut=%d Failed=%d",
            built.duration_ms,
            built.providers,
            built.cached,
            built.timed_out,
            built.failed,
        )
        return built


async def build_chat_context(
    user_id: str,
    db: Any,
    redis: Any,
    message: str,
    *,
    pinecone_index: Any = None,
    language: Optional[str] = None,
    conversation_id: Optional[str] = None,
    include_memory: bool = True,
) -> BuiltContext:
    """Public entrypoint used by ``chat.send_chat_message_stream``.

    Builds a ``ProviderContext``, runs all providers concurrently, and
    returns a ``BuiltContext``. Never raises.
    """
    ctx = ProviderContext(
        user_id=user_id,
        db=db,
        redis=redis,
        pinecone_index=pinecone_index,
        message=message,
        language=language,
        conversation_id=conversation_id,
        include_memory=include_memory,
    )
    builder = ContextBuilder(ctx)
    return await builder.run()


async def build_chat_context_with_budget(
    user_id: str,
    db: Any,
    redis: Any,
    message: str,
    *,
    pinecone_index: Any = None,
    language: Optional[str] = None,
    conversation_id: Optional[str] = None,
    include_memory: bool = True,
    budget_ms: Optional[int] = None,
) -> BuiltContext:
    """Variant of :func:`build_chat_context` with an outer wall-clock cap.

    The hard budget is observed by waiting on the gather with
    ``asyncio.wait_for``. If the budget fires, every still-running
    provider is replaced with a synthetic ``status="timeout"`` result
    so the LLM can proceed with whatever completed. This is the
    ceiling that the LLM path honors when it must begin streaming.
    """
    settings = get_settings()
    cap_ms = budget_ms or settings.CHAT_CONTEXT_HARD_BUDGET_MS
    cap_s = cap_ms / 1000.0

    ctx = ProviderContext(
        user_id=user_id,
        db=db,
        redis=redis,
        pinecone_index=pinecone_index,
        message=message,
        language=language,
        conversation_id=conversation_id,
        include_memory=include_memory,
    )

    builder = ContextBuilder(ctx)
    started = time.perf_counter()
    tasks = [
        asyncio.create_task(
            run_provider(name, _resolve_factory(name), ctx),
            name=f"ctx_provider:{name}",
        )
        for name in _PROVIDER_BUILDERS
    ]
    try:
        results = await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=False),
            timeout=cap_s,
        )
    except TimeoutError:
        # Cancel everything still running; preserve finished results.
        results = []
        for name, task in zip(_PROVIDER_BUILDERS, tasks):
            if task.done() and not task.cancelled():
                try:
                    results.append(task.result())
                    continue
                except Exception as exc:  # noqa: BLE001
                    results.append(
                        ContextResult(
                            name=name,
                            status="error",
                            error=f"{type(exc).__name__}: {exc}",
                        )
                    )
            else:
                task.cancel()
                results.append(
                    ContextResult(
                        name=name,
                        status="timeout",
                        error=f"hard budget {cap_ms}ms exceeded",
                    )
                )

    built = BuiltContext(
        duration_ms=(time.perf_counter() - started) * 1000.0,
    )
    for name, result in zip(_PROVIDER_BUILDERS, results):
        built.results[name] = result
        built.providers += 1
        if result.cached:
            built.cached += 1
        if result.status == "timeout":
            built.timed_out += 1
        elif result.status == "error":
            built.failed += 1

    logger.info(
        "Context Build Complete Duration=%.1fms Providers=%d Cached=%d "
        "TimedOut=%d Failed=%d BudgetMs=%d",
        built.duration_ms,
        built.providers,
        built.cached,
        built.timed_out,
        built.failed,
        cap_ms,
    )
    return built