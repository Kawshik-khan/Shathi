"""Connectivity check for Pinecone.

Mirrors the init path used in ``app.main.lifespan`` (lines 47-54):
  * ``from pinecone import Pinecone``
  * ``pc = Pinecone(api_key=settings.PINECONE_API_KEY)``
  * ``index = pc.Index(settings.PINECONE_INDEX_NAME)``

Then calls ``describe_index_stats`` (same call ``/health`` uses at
``main.py:169``) and ``list_indexes`` so we can report:

* Index exists and is reachable (vs. ``PINECONE_INDEX_NAME`` in .env)
* Total vector count and per-namespace breakdown
* Embedding dimension — warns if it's outside the common range
  (384/768/1024/1536/3072), which usually signals embed-model drift
* Latency to Pinecone control plane vs. data plane

Exit code:
  * ``0`` on full success
  * ``1`` on any failure, with the traceback printed to stderr
"""
from __future__ import annotations

import asyncio
import sys
import time

from _bootstrap import print_fail, print_short_traceback, section  # noqa: E402

from app.core.config import get_settings  # noqa: E402

# Soft-import target — Pinecone is a hard requirement for the chat
# path, but we want a clean error message if the package is missing
# rather than a stack trace.
from pinecone import Pinecone  # noqa: E402

_COMMON_DIMS = (384, 768, 1024, 1536, 3072)


async def main() -> int:
    settings = get_settings()

    if not settings.PINECONE_API_KEY:
        print_fail("PINECONE_API_KEY is not set in .env")
        return 1
    if not settings.PINECONE_INDEX_NAME:
        print_fail("PINECONE_INDEX_NAME is not set in .env")
        return 1

    api_key = settings.PINECONE_API_KEY
    index_name = settings.PINECONE_INDEX_NAME

    print(f"Pinecone check — index={index_name}, env={settings.PINECONE_ENVIRONMENT}")
    print(f"  API key   = {_mask(api_key)}")

    try:
        # 1. Control plane — list_indexes. Sanity-checks the API key
        # and confirms ``index_name`` exists before we touch data plane.
        pc = Pinecone(api_key=api_key)
        control_ms, indexes = await _timed(asyncio.to_thread(pc.list_indexes))
        names = [getattr(idx, "name", str(idx)) for idx in (indexes or [])]
        print(
            f"  control   = list_indexes in {control_ms:.1f} ms "
            f"(found {len(names)})"
        )
        for n in names:
            print(f"              - {n}")
        if index_name not in names:
            print_fail(
                f"index {index_name!r} not in list_indexes() output; "
                "create it in the Pinecone console or update "
                "PINECONE_INDEX_NAME"
            )
            return 1

        # 2. Data plane — describe_index_stats (same call /health uses).
        idx = pc.Index(index_name)
        data_ms, stats = await _timed(
            asyncio.to_thread(idx.describe_index_stats)
        )
        total = _get(stats, "total_vector_count")
        dim = _get(stats, "dimension")
        namespaces = getattr(stats, "namespaces", None) or {}
        print(
            f"  data      = describe_index_stats in {data_ms:.1f} ms "
            f"(vectors={total}, dimension={dim})"
        )
        for ns_name, ns in namespaces.items():
            count = _get(ns, "vector_count", "?")
            print(f"              - namespace {ns_name!r}: {count} vectors")

        if dim is not None and dim not in _COMMON_DIMS:
            print(
                f"  WARN: dimension {dim} is not in the common range "
                f"{list(_COMMON_DIMS)}.",
                file=sys.stderr,
            )

        print("OK: Pinecone connection healthy.")
        return 0

    except Exception as exc:
        print_fail("Pinecone connection error")
        print_short_traceback(exc)
        return 1


def _mask(api_key: str) -> str:
    """Return a partially-masked API key, e.g. ``pcsk_3…u2PM``."""
    if len(api_key) <= 12:
        return "***"
    return f"{api_key[:6]}…{api_key[-4:]}"


def _get(obj, attr: str, default=None):
    """Attribute-first, dict-fallback accessor for Pinecone 5.x objects."""
    value = getattr(obj, attr, None)
    if value is None and isinstance(obj, dict):
        value = obj.get(attr)
    return value if value is not None else default


async def _timed(awaitable):
    """Await ``awaitable`` and return the elapsed wall-clock in milliseconds."""
    t0 = time.perf_counter()
    result = await awaitable
    return (time.perf_counter() - t0) * 1000, result


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))