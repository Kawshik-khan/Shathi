"""Run the Supabase, Upstash, and Pinecone connectivity checks
back-to-back.

Useful as a single-command smoke test after deploying a backend that
touches Postgres, Redis, or the vector store. Self-heals on a fresh
venv by installing any missing dependencies (``certifi``,
``redis``, ``asyncpg``, ``httpx``, ``supabase``, ``pinecone``)
before the probes start.

Usage (from ``backend/``)::

    python scripts/check_dependencies.py

Exits 0 only if all three checks pass. Prints a one-line summary at
the end.
"""
from __future__ import annotations

import asyncio
import subprocess
import sys

from _bootstrap import section  # noqa: E402

import check_pinecone   # noqa: E402
import check_supabase   # noqa: E402
import check_upstash    # noqa: E402


def _ensure_dependencies() -> None:
    """Install any deps the venv is missing before probing."""
    missing: list[str] = []
    for module, pip_name in (
        ("certifi", "certifi>=2024.7.4"),
        ("redis", "redis[asyncio]>=5.0.0"),
        ("asyncpg", "asyncpg>=0.29.0"),
        ("httpx", "httpx>=0.28.0"),
        ("supabase", "supabase>=2.13.0"),
        ("pinecone", "pinecone>=5.4.0"),
    ):
        try:
            __import__(module)
        except ImportError:
            missing.append(pip_name)
    if not missing:
        return
    print(
        "Installing missing dependencies into the active venv: "
        + ", ".join(missing)
    )
    subprocess.run(
        [sys.executable, "-m", "pip", "install", *missing],
        check=True,
    )
    print("Dependencies installed.\n")


async def main() -> int:
    _ensure_dependencies()
    section("Supabase (Postgres + REST)")
    supabase_rc = await check_supabase.main()

    section("Upstash (Redis)")
    upstash_rc = await check_upstash.main()

    section("Pinecone")
    pinecone_rc = await check_pinecone.main()

    section(
        f"Summary: supabase={'OK' if supabase_rc == 0 else 'FAIL'} "
        f"upstash={'OK' if upstash_rc == 0 else 'FAIL'} "
        f"pinecone={'OK' if pinecone_rc == 0 else 'FAIL'}"
    )
    return supabase_rc or upstash_rc or pinecone_rc


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))