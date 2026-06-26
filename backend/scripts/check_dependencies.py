"""Run the Upstash and Pinecone connectivity checks back-to-back.

Useful as a single-command smoke test after deploying a backend that
touches Redis or the vector store.

Usage (from ``backend/``):

    python scripts/check_dependencies.py

Exits 0 only if both checks pass. Prints a one-line summary at the end.
"""
from __future__ import annotations

import asyncio
import sys

from _bootstrap import section  # noqa: E402

import check_pinecone  # noqa: E402
import check_upstash   # noqa: E402


async def main() -> int:
    section("Upstash (Redis)")
    upstash_rc = await check_upstash.main()

    section("Pinecone")
    pinecone_rc = await check_pinecone.main()

    section(
        f"Summary: upstash={'OK' if upstash_rc == 0 else 'FAIL'} "
        f"pinecone={'OK' if pinecone_rc == 0 else 'FAIL'}"
    )
    return upstash_rc or pinecone_rc


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))