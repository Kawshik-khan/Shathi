#!/usr/bin/env bash
#
# Apply pending Alembic migrations to the configured Supabase project.
#
# Alembic's online mode uses SQLAlchemy's async engine, which issues
# server-side PREPARE statements. Supabase's transaction-mode pooler
# (port 6543) does NOT support named prepared statements across pooled
# transactions — running migrations there fails with
# "DuplicatePreparedStatementError: prepared statement '__asyncpg_stmt_N__'
# already exists".
#
# Supabase exposes the same database via a session-mode pooler on the
# same host, port 5432. That pooler DOES support prepared statements,
# so it is the right endpoint for migrations.
#
# This script:
#   1. Reads the current SUPABASE_DB_URL from .env (without modifying it).
#   2. Rewrites the port from 6543 -> 5432 (session-mode pooler).
#   3. Exports it as an env var for this run only.
#   4. Invokes `alembic <command> <revision>`.
#   5. Restores the previous SUPABASE_DB_URL (or unsets it if it was
#      unset originally) so subsequent commands see the unchanged env.
#
# Idempotent: re-running after migrations are already applied simply
# reports "No new upgrade operations to perform" and exits 0.
#
# The FastAPI app's runtime connection is unchanged — it still uses
# the transaction-mode pooler at port 6543 (statement caches disabled
# in app/core/database.py::get_asyncpg_connect_args).
#
# Usage (from `backend/`):
#   ./scripts/run_migrations.sh                      # alembic upgrade head
#   ./scripts/run_migrations.sh upgrade 013          # apply only migration 014
#   ./scripts/run_migrations.sh downgrade base      # rollback everything
#   ./scripts/run_migrations.sh current              # show current revision
#
# Requires the project's Python venv to be activated so `alembic` and
# `app.*` are importable.

set -euo pipefail

# Resolve script directory and backend root, following symlinks.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
BACKEND_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"

cd "$BACKEND_ROOT"

ENV_FILE="$BACKEND_ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: No .env found at $ENV_FILE. Cannot resolve Supabase credentials." >&2
    exit 2
fi

# Load .env without sourcing it (avoid running arbitrary shell).
# We only need SUPABASE_DB_URL — other env entries are loaded later
# by app.core.config via pydantic-settings.
current_db_url=""
while IFS= read -r line; do
    # Strip trailing CR (Windows CRLF in .env files on Linux/macOS tools).
    line="${line%$'\r'}"
    # Skip comments / blank lines; trim leading whitespace; ignore export-prefixed lines.
    # NOTE: bash =~ uses POSIX ERE, which has no non-greedy quantifier.
    # Use greedy (.+) anchored by trailing [[:space:]]*$.
    if [[ "$line" =~ ^[[:space:]]*SUPABASE_DB_URL[[:space:]]*=[[:space:]]*(.+)[[:space:]]*$ ]]; then
        current_db_url="${BASH_REMATCH[1]}"
        # Strip surrounding quotes if present.
        current_db_url="${current_db_url%\"}"
        current_db_url="${current_db_url#\"}"
        current_db_url="${current_db_url%\'}"
        current_db_url="${current_db_url#\'}"
        break
    fi
done < "$ENV_FILE"

if [[ -z "$current_db_url" ]]; then
    echo "ERROR: SUPABASE_DB_URL not set in $ENV_FILE. Set it first (see .env.example)." >&2
    exit 2
fi

# Defaults: alembic upgrade head.
alembic_cmd="${1:-upgrade}"
alembic_revision="${2:-head}"

# Swap transaction-mode (6543) -> session-mode (5432) on the same host.
# Only swap when the URL targets the Supabase pooler; fall back to
# whatever the URL says if it's a different host (e.g. direct endpoint).
if [[ "$current_db_url" =~ ^(postgresql(\+asyncpg)?://[^@]+@[^:/]+):6543(/.*)$ ]]; then
    session_url="${BASH_REMATCH[1]}:5432${BASH_REMATCH[3]}"
else
    echo "WARNING: SUPABASE_DB_URL is not on port 6543 — using as-is." >&2
    session_url="$current_db_url"
fi

# ANSI colors only when stdout is a TTY.
if [[ -t 1 ]]; then
    C_CYAN=$'\033[36m'
    C_GREEN=$'\033[32m'
    C_RESET=$'\033[0m'
else
    C_CYAN=""
    C_GREEN=""
    C_RESET=""
fi

echo "${C_CYAN}Migration target: $session_url${C_RESET}"
echo "${C_CYAN}Alembic command:  $alembic_cmd $alembic_revision${C_RESET}"
echo ""

# Preserve previous value (or absence) so we can restore on exit.
previous_db_url="${SUPABASE_DB_URL-}"
previous_was_set=1
if [[ -z "${SUPABASE_DB_URL+x}" ]]; then
    previous_was_set=0
fi

restore_env() {
    local exit_code=$?
    if [[ "$previous_was_set" -eq 1 ]]; then
        export SUPABASE_DB_URL="$previous_db_url"
    else
        unset SUPABASE_DB_URL
    fi
    exit "$exit_code"
}
trap restore_env EXIT INT TERM ERR

export SUPABASE_DB_URL="$session_url"

# Run alembic. Capture exit code without breaking `set -e` so the trap
# can still fire and report properly.
set +e
alembic "$alembic_cmd" "$alembic_revision"
alembic_exit=$?
set -e

if [[ "$alembic_exit" -ne 0 ]]; then
    echo "ERROR: alembic $alembic_cmd $alembic_revision failed (exit $alembic_exit)." >&2
    exit "$alembic_exit"
fi

echo ""
echo "${C_GREEN}Migrations applied successfully.${C_RESET}"
echo "Runtime SUPABASE_DB_URL (in .env) is unchanged — FastAPI keeps using :6543."