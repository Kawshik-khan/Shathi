#!/bin/sh
# Container entrypoint.
#
# Notes for production:
# - We intentionally do NOT `set -e` here: a transient Supabase pooler
#   hiccup during `alembic upgrade head` must NOT prevent uvicorn from
#   starting (otherwise the service is wedged until the next deploy).
# - Migrations are retried with a short backoff. If they still fail we
#   log loudly and continue to launch the API so health checks and the
#   crash-loop breaker's exit logs remain observable.
# - The `STAMP_ON_MIGRATION_FAIL` escape hatch stamps the DB to head
#   without running migrations — useful only when the migration
#   revision chain on disk diverges from `alembic_version` (e.g. a
#   migration file was deleted post-deploy). Leave it off by default.

run_migrations() {
  attempt=1
  max_attempts="${MIGRATION_MAX_ATTEMPTS:-3}"
  while [ "$attempt" -le "$max_attempts" ]; do
    echo "[entrypoint] alembic upgrade head (attempt ${attempt}/${max_attempts})"
    if python -m alembic upgrade head; then
      echo "[entrypoint] migrations applied successfully"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
  return 1
}

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  if ! run_migrations; then
    echo "[entrypoint] WARNING: migrations failed after retries; continuing to start app"
    if [ "${STAMP_ON_MIGRATION_FAIL:-false}" = "true" ]; then
      echo "[entrypoint] STAMP_ON_MIGRATION_FAIL=true — stamping DB to head without running migrations"
      python -m alembic stamp head || true
    fi
  fi
fi

exec "$@"

