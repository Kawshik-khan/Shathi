"""Operational connectivity checks for Supabase, Upstash (Redis) and Pinecone.

These scripts are intentionally *not* pytest tests — they open real network
connections to the production-shaped URLs in ``backend/.env`` and report
the same fields the lifespan init path needs to succeed. Run them whenever
the deployed chat starts failing on the streaming path; they tell you
within a few seconds whether Supabase, Redis or Pinecone is the broken leg.

Usage (from ``backend/``):

    python scripts/check_supabase.py         # exits 0 on success, 1 on failure
    python scripts/check_upstash.py          # exits 0 on success, 1 on failure
    python scripts/check_pinecone.py         # exits 0 on success, 1 on failure
    python scripts/check_dependencies.py     # runs all three, exits 0 only if all OK
    python scripts/apply_migrations.py       # runs `alembic upgrade head` against Supabase

The scripts use ``app.core.config.get_settings()`` so they pick up
``SUPABASE_URL``, ``SUPABASE_DB_URL``, ``SUPABASE_DB_PASSWORD``,
``REDIS_URL``, ``PINECONE_API_KEY``, ``PINECONE_INDEX_NAME`` and
``PINECONE_ENVIRONMENT`` from ``.env`` automatically — same as production.
"""

__all__: list[str] = []