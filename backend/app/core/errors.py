"""Application error handling and lightweight rate limiting."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings


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
    return error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "Unexpected server error",
        "INTERNAL_SERVER_ERROR",
    )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Small process-local rate limiter for high-risk routes."""

    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, Deque[float]] = defaultdict(deque)

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
            key = f"{client}:{path}"
            now = time.monotonic()
            window_start = now - settings.RATE_LIMIT_WINDOW_SECONDS
            bucket = self.requests[key]

            while bucket and bucket[0] < window_start:
                bucket.popleft()

            if len(bucket) >= limit:
                return error_response(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Too many requests. Please try again shortly.",
                    "RATE_LIMITED",
                )

            bucket.append(now)

        return await call_next(request)
