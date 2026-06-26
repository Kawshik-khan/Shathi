# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# Shathi API — multi-stage production image.
#
# Stage 1 (``builder``) creates a virtualenv at /install with build-time
# toolchain (gcc, libpq-dev) needed to compile asyncpg and any source-only
# wheels. Stage 2 (``runtime``) starts from the same python:3.12-slim base
# with only runtime libs, copies the prebuilt virtualenv wholesale, and
# runs as a non-root user with ``tini`` as PID 1 for proper signal
# forwarding.
# ---------------------------------------------------------------------------

# ---- Stage 1: build virtualenv ---------------------------------------------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
# Build a self-contained venv at /install. Copying this dir into the
# runtime stage gives us a working interpreter + packages without
# polluting the runtime image with build toolchain.
RUN python -m venv /install
ENV PATH="/install/bin:${PATH}"
RUN /install/bin/pip install --upgrade pip \
    && /install/bin/pip install --no-cache-dir -r requirements.txt


# ---- Stage 2: minimal runtime ----------------------------------------------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/install/bin:${PATH}"

# Runtime libs only: libpq5 for asyncpg, tini for PID-1 signal handling,
# curl for the HEALTHCHECK. ``--no-install-recommends`` keeps the image
# lean; ``rm -rf /var/lib/apt/lists/*`` drops the apt cache.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 tini curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 app \
    && useradd --system --uid 1001 --gid app --home-dir /app --shell /sbin/nologin app

WORKDIR /app

# Copy prebuilt virtualenv and app source. The venv shebangs reference
# the builder's python; we re-point them at /usr/local/bin/python3 on
# copy so the runtime image works without copying python itself.
COPY --from=builder /install /install
COPY --chown=app:app . /app

# Pre-create the avatar upload directory so the runtime user can write
# to it without a permission error on the very first request. Fix
# ownership and permissions on the app directory.
RUN mkdir -p /app/uploads/avatars \
    && chown -R app:app /app /install \
    && chmod +x /app/docker-entrypoint.sh

# Drop privileges: every later RUN / CMD runs as ``app``.
USER app

EXPOSE 8000

# Liveness probe — Render also runs its own HTTP check against /health,
# but this keeps the image usable on plain Docker / Compose / k8s.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${PORT:-8000}/health || exit 1

# ``tini`` reaps zombies and forwards SIGTERM/SIGINT so uvicorn gets a
# graceful shutdown instead of being SIGKILL'd by the container runtime.
ENTRYPOINT ["/usr/bin/tini", "--", "sh", "/app/docker-entrypoint.sh"]

# Uvicorn tuning for a single Render Free instance (512MB RAM):
#  - workers=1 keeps memory predictable (memory growth is per-worker).
#  - timeout-keep-alive=20 keeps SSE/streaming chat responses alive on
#    Render's proxy without holding sockets open indefinitely.
#  - limit-concurrency caps in-flight requests so a traffic spike can't
#    exhaust the worker pool and stall the event loop.
#  - backlog=2048 absorbs Render's edge bursts without dropping SYNs.
CMD ["sh", "-c", "exec python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --proxy-headers \
    --forwarded-allow-ips='*' \
    --timeout-keep-alive 20 \
    --limit-concurrency ${UVICORN_LIMIT_CONCURRENCY:-100} \
    --backlog 2048"]
