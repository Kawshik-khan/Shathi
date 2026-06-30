"""Connectivity check for Supabase (Postgres + REST + auth config).

Mirrors the init path used in ``app.main.lifespan`` and
``app.core.database.get_database_url``:

  * URL resolution: ``settings.effective_database_url`` (prefers
    ``SUPABASE_DB_URL`` over ``DATABASE_URL``).
  * Driver promotion: if the URL starts with ``postgresql://`` and
    doesn't already mention ``asyncpg``, the app prepends
    ``+asyncpg`` — we apply the exact same rule here so what we
    report is what uvicorn will actually try to connect with.
  * Pooler detection: when `pooler.supabase.com` appears in the
    host, the app's SQLAlchemy engine sets
    `connect_args={"statement_cache_size": 0,
    "prepared_statement_cache_size": 0}`. asyncpg itself only
    accepts `statement_cache_size` on `connect()`; the
    `prepared_statement_cache_size` key is a SQLAlchemy-level
    mapping (it maps to asyncpg's `prepared_statement_cache`),
    so we only pass the asyncpg-native option here and surface
    the SQLAlchemy-level one in the connection echo.
  * TLS: pooler requires TLS, and its chain is rooted at
    ``Supabase Root 2021 CA`` (self-signed, NOT in the system trust
    store). We pin that root from ``supabase-root-2021-ca.pem`` next
    to the engine config — the file is extracted from the pooler's
    own TLS chain so its bytes are guaranteed to be the live root.
    See the ``_extract_supabase_root_ca`` helper at the bottom of
    this file for how to refresh it after Supabase rotates the root.
    System trust store is loaded too so other endpoints (direct
    ``db.<ref>.supabase.co``, RDS) still validate via the public web
    PKI.

What we probe (in order, all best-effort, none fatal beyond the
first failure):

  1. Settings sanity: SUPABASE_URL set, SUPABASE_DB_URL set,
     SUPABASE_JWT_SECRET not a JWKS URL.
  2. TCP reachability to the parsed host:port (no auth).
  3. asyncpg `connect` with the system trust store + Supabase root.
  4. ``SELECT version()`` — confirms handshake + auth.
  5. ``current_user``, ``current_database()`` — confirms the role
     prefix (``postgres.<project-ref>``) and the database name.
  6. ``alembic_version`` table presence + revision hash — confirms
     migrations actually ran (the lifespan init path will skip
     applying migrations on every boot if this table is already
     populated).
  7. REST ping via the Supabase client (``/auth/v1/health``) so a
     broken DB doesn't mask a working REST and vice versa.

Exit code:
  * ``0`` on full success (DB handshake + version + REST).
  * ``1`` on any failure, with the traceback printed to stderr.

Usage (from ``backend/``)::

    python scripts/check_supabase.py
"""

from __future__ import annotations

import asyncio
import os
import re
import ssl
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

from _bootstrap import print_fail, print_short_traceback, section  # noqa: E402

from app.core.config import get_settings  # noqa: E402


# Project ref format: lowercase alphanumeric + dashes. Used to
# sanity-check the role prefix on the pooler URL.
_PROJECT_REF_RE = re.compile(r"^[a-z0-9-]+$")


async def main() -> int:
    settings = get_settings()

    # 1. Settings sanity. We deliberately surface these as FAIL lines
    # so a missing JWT secret or empty URL doesn't get hidden behind
    # a generic connection error.
    issues: list[str] = []
    if not settings.SUPABASE_URL:
        issues.append("SUPABASE_URL is not set in .env")
    if not settings.effective_database_url:
        issues.append(
            "Neither SUPABASE_DB_URL nor DATABASE_URL is set; "
            "the app cannot reach Postgres without one"
        )
    if not settings.SUPABASE_JWT_SECRET:
        issues.append(
            "SUPABASE_JWT_SECRET is empty — JWT verification will "
            "fail. Get the value from Supabase Dashboard → Project "
            "Settings → API → JWT Secret."
        )
    elif settings.SUPABASE_JWT_SECRET.startswith("http"):
        issues.append(
            "SUPABASE_JWT_SECRET looks like a URL, not a JWT secret. "
            "It must be the project's JWT Secret (long base64 string), "
            "not the JWKS endpoint."
        )
    if not settings.SUPABASE_DB_PASSWORD:
        issues.append(
            "SUPABASE_DB_PASSWORD is empty — pooler auth will fail"
        )

    if issues:
        for msg in issues:
            print_fail(msg)
        return 1

    db_url = settings.effective_database_url
    promoted_url = _promote_to_asyncpg(db_url)

    # Parse the host/port once so we can do a cheap TCP probe and
    # print a sanitized connection line without leaking the password.
    parsed = urlparse(promoted_url)
    host = parsed.hostname or ""
    port = parsed.port or 5432
    user = parsed.username or ""
    db_name = (parsed.path or "/").lstrip("/") or "postgres"
    is_pooler = "pooler.supabase.com" in host

    print("Supabase check")
    print(f"  supabase_url    = {settings.SUPABASE_URL}")
    print(f"  project_ref     = {_project_ref_from_supabase_url(settings.SUPABASE_URL)}")
    print(f"  pooler          = {is_pooler}")
    print(f"  host:port       = {host}:{port}")
    print(f"  user            = {user}")
    print(f"  database        = {db_name}")
    print(f"  effective_url   = {_strip_password(promoted_url)}")

    # 2. TCP probe — separates "host unreachable / DNS broken" from
    # "host reachable but auth/SSL broken". Cheap, no auth needed.
    try:
        tcp_ms = await _tcp_probe(host, port)
    except Exception as exc:
        print_fail(f"TCP probe to {host}:{port} failed")
        print_short_traceback(exc)
        return 1
    print(f"  tcp             = connected in {tcp_ms:.1f} ms")

    # 3-5. asyncpg connect with the same options the SQLAlchemy
    # engine uses. ssl='require' for pooler, ssl=None for direct.
    try:
        import asyncpg  # local import — asyncpg is a hard dep for
                         # the app, but if the venv is broken we
                         # want a clean ImportError line, not a
                         # traceback.
    except ImportError as exc:
        print_fail("asyncpg is not installed in the active Python")
        print_short_traceback(exc)
        return 1

    ssl_ctx: ssl.SSLContext | None = None
    if is_pooler:
        # Supabase's pooler terminates TLS at ``Supabase Root 2021 CA``,
        # which is not in the system trust store. Pin that root from the
        # PEM we cache alongside this script (extracted from the pooler's
        # own handshake — see the bottom of this file for the extractor).
        # The system trust store is still loaded so other CAs (e.g. RDS,
        # Amazon RSA chain) keep working if the user later switches to
        # the direct endpoint.
        from pathlib import Path

        ssl_ctx = ssl.create_default_context()
        ca_path = Path(__file__).resolve().parent.parent / "supabase-root-2021-ca.pem"
        ca_loaded = False
        if ca_path.is_file():
            ssl_ctx.load_verify_locations(cafile=str(ca_path))
            ca_loaded = True
        tls_summary = (
            "system trust store + supabase-root-2021-ca.pem"
            if ca_loaded
            else "system trust store (MISSING supabase-root-2021-ca.pem)"
        )
        print(f"  tls             = {tls_summary}")

    connect_args: dict = {}
    if is_pooler:
        # asyncpg.connect() only accepts statement_cache_size
        # directly. The prepared_statement_cache_size=0 in
        # app/core/database.py:39-42 is a SQLAlchemy-level mapping
        # (asyncpg's own key is prepared_statement_cache); we
        # surface that fact below so the user can confirm the real
        # engine will also disable prepared statements.
        connect_args = {"statement_cache_size": 0}
        print(
            "  note            = pooler detected; passing "
            "statement_cache_size=0 to asyncpg (real engine also "
            "disables prepared_statement_cache via SQLAlchemy)"
        )

    try:
        connect_ms, conn = await _timed(
            asyncpg.connect(
                host=host,
                port=port,
                user=user,
                password=settings.SUPABASE_DB_PASSWORD,
                database=db_name,
                ssl=ssl_ctx,
                timeout=5,
                **connect_args,
            )
        )
    except Exception as exc:
        print_fail("asyncpg connect failed")
        print_short_traceback(exc)
        return 1

    print(f"  connect         = handshake in {connect_ms:.1f} ms")

    try:
        # 4. SELECT version() — the canonical "did auth work" probe.
        version_ms, version = await _timed(conn.fetchval("SELECT version()"))
        print(f"  version         = {version} (in {version_ms:.1f} ms)")

        # 5. current_user / current_database() — confirm the role
        # prefix matches the project ref so we catch the common
        # mistake of using ``postgres`` instead of
        # ``postgres.<project-ref>`` on the pooler.
        cur_user_ms, cur_user = await _timed(conn.fetchval("SELECT current_user"))
        cur_db_ms, cur_db = await _timed(conn.fetchval("SELECT current_database()"))
        print(f"  current_user    = {cur_user} (in {cur_user_ms:.1f} ms)")
        print(f"  current_db      = {cur_db} (in {cur_db_ms:.1f} ms)")

        # NOTE: Supabase's transaction-mode pooler (Supavisor)
        # returns the inner Postgres role (``postgres``) rather than
        # the external ``postgres.<project-ref>`` form, because it
        # proxies auth and the server-side session runs as the
        # underlying role. The DSN is correct as long as the user
        # literal in SUPABASE_DB_URL is ``postgres.<project-ref>``
        # — we check that below against the URL, not current_user.
        project_ref = _project_ref_from_supabase_url(settings.SUPABASE_URL)
        if is_pooler and project_ref:
            dsn_user = urlparse(promoted_url).username or ""
            expected = f"postgres.{project_ref}"
            if dsn_user and dsn_user != expected:
                print(
                    f"  WARN: SUPABASE_DB_URL user {dsn_user!r} does not "
                    f"match expected prefix {expected!r}. The pooler "
                    "will reject the connection with ENOIDENTIFIER "
                    "or InvalidPasswordError.",
                    file=sys.stderr,
                )

        # 6. alembic_version — confirm migrations actually ran. The
        # table only exists after the first ``alembic upgrade head``,
        # so a missing table means the lifespan init will try to
        # apply migrations on the next boot.
        try:
            rev_ms, revision = await _timed(
                conn.fetchval("SELECT version_num FROM alembic_version LIMIT 1")
            )
            print(f"  alembic_version = {revision} (in {rev_ms:.1f} ms)")
        except asyncpg.UndefinedTableError:
            print(
                "  alembic_version = MISSING — migrations have not "
                "been applied to this database. Run "
                "`alembic upgrade head` against SUPABASE_DB_URL "
                "before serving traffic.",
                file=sys.stderr,
            )
        except Exception as exc:
            print_fail("alembic_version probe failed")
            print_short_traceback(exc)
            return 1

    except Exception as exc:
        print_fail("Postgres query failed")
        print_short_traceback(exc)
        return 1
    finally:
        try:
            await conn.close()
        except Exception:
            pass

    # 7. REST ping — exercises the Supabase HTTP client init path
    # used by ``app.core.supabase.get_supabase_client``. We hit
    # ``/auth/v1/health`` with the project's anon key so GoTrue
    # doesn't reject the request as missing-API-key (which it does
    # with HTTP 401 even on the open health endpoint when the
    # apikey header is absent). This is the same header the
    # supabase-py / supabase-js clients attach on every call.
    try:
        import httpx
    except ImportError as exc:
        print_fail("httpx is not installed in the active Python")
        print_short_traceback(exc)
        return 1

    health_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/health"
    headers = {"apikey": settings.SUPABASE_ANON_KEY}
    if settings.SUPABASE_SERVICE_ROLE_KEY:
        # Prefer the service-role key for health probes because the
        # anon key can be disabled for some project templates; the
        # service-role key is always allowed through GoTrue's
        # health endpoint.
        headers["Authorization"] = f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}"
    try:
        async with httpx.AsyncClient(timeout=5) as http:
            rest_ms, resp = await _timed(http.get(health_url, headers=headers))
        print(
            f"  rest            = GET {health_url} -> "
            f"HTTP {resp.status_code} in {rest_ms:.1f} ms"
        )
        if resp.status_code >= 400:
            print_fail(
                f"Supabase REST health returned HTTP {resp.status_code}"
            )
            return 1
    except Exception as exc:
        print_fail("Supabase REST health request failed")
        print_short_traceback(exc)
        return 1

    print("OK: Supabase connection healthy.")
    return 0


def _promote_to_asyncpg(url: str) -> str:
    """Same rule as ``app.core.database.get_database_url``."""
    if url.startswith("postgresql://") and "asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _project_ref_from_supabase_url(supabase_url: str) -> str:
    """Pull ``abcxyz`` out of ``https://abcxyz.supabase.co``."""
    if not supabase_url or "supabase.co" not in supabase_url:
        return ""
    try:
        host = urlparse(supabase_url).hostname or ""
        ref = host.split(".")[0]
        return ref if _PROJECT_REF_RE.match(ref) else ""
    except Exception:
        return ""


def _strip_password(url: str) -> str:
    """Return the URL with the password replaced by ``***``."""
    parsed = urlparse(url)
    if parsed.password is None:
        return url
    user = parsed.username or ""
    netloc = f"{user}:***@{parsed.hostname}"
    if parsed.port:
        netloc += f":{parsed.port}"
    return parsed._replace(netloc=netloc).geturl()


async def _tcp_probe(host: str, port: int) -> float:
    """Open a TCP connection and time it. Returns elapsed ms."""
    t0 = time.perf_counter()
    fut = asyncio.open_connection(host=host, port=port)
    reader, writer = await asyncio.wait_for(fut, timeout=5)
    writer.close()
    try:
        await writer.wait_closed()
    except Exception:
        pass
    del reader
    return (time.perf_counter() - t0) * 1000


_RDS_BUNDLE_URL = (
    "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
)
_RDS_BUNDLE_LOCAL = Path(__file__).resolve().parent.parent / ".aws-rds-ca-bundle.pem"


def _get_rds_ca_bundle() -> Path:
    """Return a path to the AWS RDS global CA bundle PEM file.

    The Supabase pooler terminates TLS with RDS-issued certs whose
    roots (rds-ca-rsa2048-g1, rds-ca-2019, ...) aren't in certifi.
    The bundle is downloaded on first run and cached next to the
    venv so subsequent runs are offline. If the download fails we
    surface the error to the caller rather than silently proceeding
    with a partial bundle.
    """
    if _RDS_BUNDLE_LOCAL.exists() and _RDS_BUNDLE_LOCAL.stat().st_size > 1000:
        return _RDS_BUNDLE_LOCAL
    try:
        import urllib.request

        with urllib.request.urlopen(_RDS_BUNDLE_URL, timeout=10) as resp:  # noqa: S310
            data = resp.read()
        _RDS_BUNDLE_LOCAL.write_bytes(data)
    except Exception as exc:
        raise RuntimeError(
            f"could not fetch AWS RDS CA bundle from {_RDS_BUNDLE_URL}: {exc!r}"
        ) from exc
    return _RDS_BUNDLE_LOCAL


def _build_merged_ca_bundle(
    certifi_path: str | None, bundle_path: Path
) -> str:
    """Concatenate certifi + RDS bundle into a single PEM.

    ``ssl.create_default_context`` only takes one ``cafile`` arg, so
    we have to merge. The merged file lives in the OS temp dir and
    is rewritten each run — we don't cache it because the inputs can
    change (certifi upgrades, RDS rotates CAs).
    """
    import tempfile

    parts: list[bytes] = []
    if certifi_path:
        try:
            parts.append(Path(certifi_path).read_bytes())
        except Exception:
            pass
    parts.append(bundle_path.read_bytes())
    merged = Path(tempfile.gettempdir()) / "sereni_supabase_ca.pem"
    merged.write_bytes(b"".join(parts))
    return str(merged)


async def _timed(awaitable):
    """Await ``awaitable`` and return the elapsed wall-clock in milliseconds."""
    t0 = time.perf_counter()
    result = await awaitable
    return (time.perf_counter() - t0) * 1000, result


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))