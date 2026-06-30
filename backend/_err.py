"""Application error handling and rate limiting.

The :class:`RateLimitMiddleware` uses a Redis sliding window when one is
attached to ``app.state.redis`` (the lifespan handler in ``app.main``
already does that). When Redis is unavailable — typically on a developer
laptop, in CI, or before the first Redis ping succeeds — we transparently
fall back to a process-local sliding window keyed the same way. The two
implementations share the same key shape so a transition from local to
shared state does not reset counters that have already accumulated.
"""
from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict, deque
from typing import Deque

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def error_response(status_code: int, message: str, code: str) -> JSONResponse:  
    return JSONResponse(
        status_code=status_code,
        content={"error": {"message": message, "code": code, "status": status_code}},
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return error_response(exc.status_code, detail, "HTTP_ERROR")


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "message": "Validation failed",
                "code": "VALIDATION_ERROR",
                "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "details": exc.errors(),
            }
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Surface a correlation id so logs can be matched against a user report.
    correlation_id = uuid.uuid4().hex[:12]
    logger.exception("Unhandled error (correlation_id=%s)", correlation_id)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "message": "Unexpected server error",
                "code": "INTERNAL_SERVER_ERROR",
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "correlation_id": correlation_id,
            }
        },
    )


# Sliding-window Lua script. Atomic on the Redis side: trim, count, and
# (if under the limit) record the new request in a single round-trip so
# two replicas racing on the same key cannot both squeeze in past the
# cap. ``KEYS[1]`` is the bucket key; ``ARGV`` carries now (ms), window
# (ms), limit, and a unique member token.
#
# Returns 1 when the request was admitted (and recorded), 0 when blocked.
_RATE_LIMIT_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
    return 0
end
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window)
return 1
"""


class _LocalSlidingWindow:
    """Process-local fallback. Same semantics as the Redis script above."""

    def __init__(self) -> None:
        self._buckets: dict[str, Deque[float]] = defaultdict(deque)

    def record(self, key: str, now_ms: int, window_ms: int, limit: int) -> bool:
        """Return True if the request was admitted, False if it was blocked."""
        bucket = self._buckets[key]
        window_start = now_ms - window_ms
        while bucket and bucket[0] < window_start:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now_ms)
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limiter for high-risk routes.

    Prefers the shared Redis bucket (so multiple replicas enforce the
    same limit) and falls back to an in-process window when Redis is
    unavailable. A Redis error during dispatch never blocks the request —
    we degrade to the local window and log once.
    """

    def __init__(self, app):
        super().__init__(app)
        self._local = _LocalSlidingWindow()
        self._redis_unhealthy_logged = False
        self._redis_script = None  # lazily registered on first use

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        path = request.url.path
        limit = None

        if path.startswith("/api/v1/auth/"):
            limit = settings.AUTH_RATE_LIMIT_MAX
        elif path.startswith("/api/v1/chat/"):
            limit = settings.CHAT_RATE_LIMIT_MAX

        if limit is not None:
            client = request.client.host if request.client else "unknown"
            key = f"rl:{client}:{path}"
            window_ms = settings.RATE_LIMIT_WINDOW_SECONDS * 1000
            now_ms = int(time.time() * 1000)

            redis = getattr(request.app.state, "redis", None)
            admitted: bool | None = None

            if redis is not None:
                try:
                    if self._redis_script is None:
                        self._redis_script = redis.register_script(
                            _RATE_LIMIT_LUA
                        )
                    result = await self._redis_script(
                        keys=[key],
                        args=[now_ms, window_ms, limit, uuid.uuid4().hex],
                    )
                    admitted = bool(int(result))
                    self._redis_unhealthy_logged = False
                except Exception as exc:  # pragma: no cover - log-and-fall-back
                    if not self._redis_unhealthy_logged:
                        logger.warning(
                            "Redis rate limit failed (%s); falling back to "
                            "process-local window for this and future "
                            "requests until Redis recovers.",
                            exc,
                        )
                        self._redis_unhealthy_logged = True

            if admitted is None:
                admitted = self._local.record(key, now_ms, window_ms, limit)

            if not admitted:
                return error_response(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Too many requests. Please try again shortly.",
                    "RATE_LIMITED",
                )

        return await call_next(request)
