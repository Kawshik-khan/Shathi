"""Provider protocol + per-provider isolation primitive.

Every context source (profile, mood, journal, sleep, habit, activity,
memory, inferred mood) is wrapped in ``run_provider``. The wrapper:

* enforces its own timeout (``CHAT_PROVIDER_TIMEOUT_MS``) so a slow
  source can never block the LLM;
* swallows exceptions and records them on ``ContextResult.error`` so a
  single failing source cannot abort the request;
* records duration, cached flag, and token estimate for structured logs;
* emits one ``INFO`` line per provider using the standard key=value
  format used elsewhere in the app.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Optional, Protocol, runtime_checkable

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class ContextResult:
    """Output of one provider. Always populated; never raises."""

    name: str
    status: str = "ok"           # ok | timeout | error | empty
    duration_ms: float = 0.0
    cached: bool = False
    parts: list[str] = field(default_factory=list)
    tokens: int = 0
    error: Optional[str] = None
    data: dict[str, Any] = field(default_factory=dict)

    @property
    def is_ok(self) -> bool:
        return self.status == "ok" and bool(self.parts or self.data)


@runtime_checkable
class ContextProvider(Protocol):
    """A single context source.

    ``produce`` must NOT raise. Use ``run_provider`` to enforce
    timeout/isolation guarantees. Returning an empty ``ContextResult``
    is allowed and means "no data" (status="ok", empty parts).
    """

    name: str

    async def produce(self, ctx: "ProviderContext") -> ContextResult: ...


@dataclass
class ProviderContext:
    """Bag of dependencies passed to each provider."""

    user_id: str
    db: Any
    redis: Any
    pinecone_index: Any
    message: str
    language: Optional[str] = None
    conversation_id: Optional[str] = None
    include_memory: bool = True


ProviderFactory = Callable[[ProviderContext], Awaitable[ContextResult]]


def _log_provider_result(result: ContextResult) -> None:
    """Emit one structured log line per provider result.

    Format mirrors the requirement in Phase 13::

        ContextProvider=Mood Duration=183ms Cached=true TimedOut=false Failed=false Tokens=24

    """
    logger.info(
        "ContextProvider=%s Status=%s Duration=%.1fms Cached=%s TimedOut=%s Failed=%s Tokens=%d%s",
        result.name,
        result.status,
        result.duration_ms,
        str(result.cached).lower(),
        str(result.status == "timeout").lower(),
        str(result.status == "error").lower(),
        result.tokens,
        f" Error={result.error}" if result.error else "",
    )


async def run_provider(
    name: str,
    factory: ProviderFactory,
    ctx: ProviderContext,
    *,
    timeout_ms: Optional[int] = None,
) -> ContextResult:
    """Run one provider with isolation guarantees.

    * ``factory`` is awaited with a per-provider timeout.
    * Any exception is captured on ``result.error``.
    * Cancellation from outside is re-raised after recording the abort.
    * Result is always logged structurally.
    """
    settings = get_settings()
    budget_s = (timeout_ms or settings.CHAT_PROVIDER_TIMEOUT_MS) / 1000.0

    started = time.perf_counter()
    try:
        async with asyncio.timeout(budget_s):
            result = await factory(ctx)
        result.name = name
        result.duration_ms = (time.perf_counter() - started) * 1000.0
        if not result.parts and not result.data and result.status == "ok":
            result.status = "empty"
        _log_provider_result(result)
        return result
    except TimeoutError:
        result = ContextResult(
            name=name,
            status="timeout",
            duration_ms=(time.perf_counter() - started) * 1000.0,
            error=f"timeout after {int(budget_s * 1000)}ms",
        )
        _log_provider_result(result)
        return result
    except asyncio.CancelledError:
        # Outer cancellation (client disconnect). Surface, do not swallow.
        raise
    except Exception as exc:  # noqa: BLE001 - we deliberately isolate providers
        result = ContextResult(
            name=name,
            status="error",
            duration_ms=(time.perf_counter() - started) * 1000.0,
            error=f"{type(exc).__name__}: {exc}",
        )
        _log_provider_result(result)
        return result