"""Operational connectivity checks for Upstash (Redis) and Pinecone.

These scripts are intentionally *not* pytest tests — they open real network
connections to the production-shaped URLs in ``backend/.env`` and report
the same fields the lifespan init path needs to succeed. Run them whenever
the deployed chat starts failing on the streaming path; they tell you
within a few seconds whether Redis or Pinecone is the broken leg.

Usage (from ``backend/``):

    python scripts/check_upstash.py          # exits 0 on success, 1 on failure
    python scripts/check_pinecone.py         # exits 0 on success, 1 on failure
    python scripts/check_dependencies.py     # runs both, exits 0 only if all OK

The scripts use ``app.core.config.get_settings()`` so they pick up
``REDIS_URL``, ``PINECONE_API_KEY``, ``PINECONE_INDEX_NAME`` and
``PINECONE_ENVIRONMENT`` from ``.env`` automatically — same as production.
"""

__all__: list[str] = []