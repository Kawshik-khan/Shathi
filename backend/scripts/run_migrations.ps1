<#
.SYNOPSIS
    Apply pending Alembic migrations to the configured Supabase project.

.DESCRIPTION
    Alembic's online mode uses SQLAlchemy's async engine, which issues
    server-side PREPARE statements. Supabase's transaction-mode pooler
    (port 6543) does NOT support named prepared statements across
    pooled transactions — running migrations there fails with
    "DuplicatePreparedStatementError: prepared statement '__asyncpg_stmt_N__'
    already exists".

    Supabase exposes the same database via a session-mode pooler on the
    same host, port 5432. That pooler DOES support prepared statements,
    so it is the right endpoint for migrations.

    This script:
      1. Reads the current SUPABASE_DB_URL from .env (without modifying it).
      2. Rewrites the port from 6543 -> 5432 (session-mode pooler).
      3. Sets it as a process-level env var for this run only.
      4. Invokes `alembic upgrade head`.
      5. Restores the previous SUPABASE_DB_URL (or unsets it if it was
         unset originally) so subsequent commands see the unchanged env.

    Idempotent: re-running after migrations are already applied simply
    reports "No new upgrade operations to perform" and exits 0.

    The FastAPI app's runtime connection is unchanged — it still uses
    the transaction-mode pooler at port 6543 (statement caches disabled
    in app/core/database.py::get_asyncpg_connect_args).

.PARAMETER Revision
    Optional target revision (default: "head"). Use "head+1" to apply a
    single migration, or a specific revision id to upgrade/downgrade to
    a known point. Downgrades pass "downgrade" as the command and the
    target as -Revision.

.PARAMETER Command
    Alembic command to run. Default "upgrade". Use "downgrade" to roll
    back. Anything else is forwarded verbatim.

.EXAMPLE
    .\scripts\run_migrations.ps1
    # alembic upgrade head

.EXAMPLE
    .\scripts\run_migrations.ps1 -Revision 013
    # alembic upgrade 013 (apply only migration 014)

.EXAMPLE
    .\scripts\run_migrations.ps1 -Command downgrade -Revision base
    # alembic downgrade base (rollback everything)

.NOTES
    Run from `backend/`. Requires the project's Python venv to be
    activated so `alembic` and `app.*` are importable.
#>
[CmdletBinding()]
param(
    [string]$Revision = "head",
    [ValidateSet("upgrade", "downgrade", "stamp", "history", "current", "heads")]
    [string]$Command = "upgrade"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Resolve script directory and backend root.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackendRoot = Resolve-Path (Join-Path $ScriptDir "..")

$EnvFile = Join-Path $BackendRoot ".env"

if (-not (Test-Path $EnvFile)) {
    Write-Error "No .env found at $EnvFile. Cannot resolve Supabase credentials."
    exit 2
}

# Load .env without sourcing it (avoid running arbitrary shell).
# We only need SUPABASE_DB_URL — other env entries are loaded later
# by app.core.config via pydantic-settings.
$envLines = Get-Content -LiteralPath $EnvFile -ErrorAction Stop
$currentDbUrl = $null
foreach ($line in $envLines) {
    if ($line -match '^\s*SUPABASE_DB_URL\s*=\s*(.+?)\s*$') {
        $currentDbUrl = $Matches[1]
        break
    }
}

if (-not $currentDbUrl) {
    Write-Error "SUPABASE_DB_URL not set in $EnvFile. Set it first (see .env.example)."
    exit 2
}

# Swap transaction-mode (6543) -> session-mode (5432) on the same host.
# Only swap when the URL targets the Supabase pooler; fall back to
# whatever the URL says if it's a different host (e.g. direct endpoint).
if ($currentDbUrl -match '^(?<prefix>postgresql(?:\+asyncpg)?://[^@]+@[^:/]+):6543(?<suffix>/.*)$') {
    $sessionUrl = $Matches['prefix'] + ':5432' + $Matches['suffix']
} else {
    Write-Warning "SUPABASE_DB_URL is not on port 6543 - using as-is."
    $sessionUrl = $currentDbUrl
}

Write-Host "Migration target: $sessionUrl" -ForegroundColor Cyan
Write-Host "Alembic command:  $Command $Revision" -ForegroundColor Cyan
Write-Host ""

# Preserve previous value so we can restore after the run.
$previous = $env:SUPABASE_DB_URL
$exitCode = 0
$restoreNeeded = $true

Push-Location $BackendRoot
try {
    $env:SUPABASE_DB_URL = $sessionUrl
    & alembic $Command $Revision
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        Write-Error "alembic $Command $Revision failed (exit $exitCode)."
    }
}
finally {
    Pop-Location
    if ($restoreNeeded) {
        if ($null -eq $previous) {
            Remove-Item Env:SUPABASE_DB_URL -ErrorAction SilentlyContinue
        } else {
            $env:SUPABASE_DB_URL = $previous
        }
    }
}

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "Migrations applied successfully." -ForegroundColor Green
    Write-Host "Runtime SUPABASE_DB_URL (in .env) is unchanged - FastAPI keeps using :6543."
}
exit $exitCode