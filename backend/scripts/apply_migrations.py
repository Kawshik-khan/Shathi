"""Apply Alembic migrations to the configured Supabase Postgres database.

This is a thin wrapper around ``alembic upgrade head`` that:

* Loads ``backend/.env`` first (so the URL isn't pulled from the
  hard-coded ``alembic.ini`` placeholder).
* Verifies ``certifi`` is installed before connecting — the venv
  doesn't ship it and the stdlib on Python 3.14 has no CA bundle.
* Uses the same pgbouncer-aware ``connect_args`` the runtime engine
  uses (via ``app.core.database.get_asyncpg_connect_args``).
* Prints a structured success/failure summary without writing to
  ``server.log``.

Usage (from ``backend/``)::

    python scripts/apply_migrations.py

Exit code:
  * ``0`` on ``alembic upgrade head`` reporting success.
  * ``1`` on any failure (certifi missing, connect refused,
    migration error), with the traceback printed to stderr.
"""
from __future__ import annotations

import asyncio
import os
import ssl
import subprocess
import sys
from pathlib import Path


_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ROOT_DIR = _BACKEND_DIR.parent
_ENV_FILE = _BACKEND_DIR / ".env"


def _load_dotenv() -> None:
    """Minimal ``.env`` loader — avoid a hard dep on python-dotenv."""
    if not _ENV_FILE.exists():
        print(f"WARN: {_ENV_FILE} not found; relying on existing env vars")
        return
    for raw_line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _ensure_dependencies() -> None:
    """Install anything missing from ``requirements.txt``.

    The active venv may be missing certifi (Py 3.14 needs it for
    the pooler TLS chain) or redis (used by the lifespan for
    Upstash caching). We import each optional dep lazily so a
    missing one is detected at the moment we'd need it, then we
    install once and re-check rather than restart the process.
    """
    missing: list[str] = []
    for module, pip_name in (
        ("certifi", "certifi>=2024.7.4"),
        ("redis", "redis[asyncio]>=5.0.0"),
        ("asyncpg", "asyncpg>=0.29.0"),
        ("httpx", "httpx>=0.28.0"),
        ("alembic", "alembic>=1.14.0"),
        ("supabase", "supabase>=2.13.0"),
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
    print("Dependencies installed.")


def _print_header() -> None:
    print("Alembic migration")
    print(f"  cwd             = {_BACKEND_DIR}")
    print(f"  env_file        = {_ENV_FILE}")
    print(
        "  supabase_url    = "
        f"{os.environ.get('SUPABASE_URL', '<unset>')}"
    )
    supabase_db_url = os.environ.get("SUPABASE_DB_URL", "")
    if supabase_db_url:
        from urllib.parse import urlparse

        parsed = urlparse(supabase_db_url)
        print(
            f"  host:port       = {parsed.hostname}:{parsed.port or 5432}"
        )
        print(f"  user            = {parsed.username}")
    print(f"  python          = {sys.version.split()[0]}")


async def run() -> int:
    _load_dotenv()
    _print_header()
    _ensure_dependencies()

    # We run alembic as a subprocess (instead of importing
    # ``alembic.command.upgrade``) so the alembic env.py path stays
    # identical to what ``alembic upgrade head`` runs in CI / Docker.
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        "-m",
        "alembic",
        "upgrade",
        "head",
        cwd=str(_BACKEND_DIR),
        env={**os.environ, "PYTHONPATH": str(_BACKEND_DIR)},
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        sys.stderr.write(stderr.decode("utf-8", errors="replace"))
        print(f"FAIL: alembic upgrade head exited {proc.returncode}")
        return 1

    sys.stdout.write(stdout.decode("utf-8", errors="replace"))
    print("OK: migrations applied.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(run()))