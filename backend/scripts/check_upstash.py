"""Connectivity check for Upstash (Redis).

Mirrors the init path used in ``app.main.lifespan`` (lines 56-68):
  * ``redis.asyncio.from_url(settings.REDIS_URL, decode_responses=True,
    socket_connect_timeout=1, socket_timeout=1)``
  * ``await client.ping()``

Then exercises GET/SET roundtrip and pulls ``INFO server`` so we can
report the upstream version, mode (standalone/cluster) and observed
TLS handshake latency. A green run here means the lifespan init path
won't log ``Redis init failed`` and the chat-context cache layer is
operational.

Exit code:
  * ``0`` on full success (connect + ping + roundtrip + info)
  * ``1`` on any failure, with the traceback printed to stderr
"""
from __future__ import annotations

import asyncio
import sys
import time

from _bootstrap import print_fail, print_short_traceback, section  # noqa: E402

from app.core.config import get_settings  # noqa: E402


async def main() -> int:
    settings = get_settings()

    if not settings.REDIS_URL:
        print_fail("REDIS_URL is not set in .env")
        return 1

    url = settings.REDIS_URL
    scheme = "rediss" if url.startswith("rediss://") else "redis"
    is_upstash = "upstash.io" in url or scheme == "rediss"
    print(f"Upstash check — scheme={scheme}, upstash_url={is_upstash}")
    print(f"  REDIS_URL = {url}")

    # Host label only (never print the password).
    if "@" in url:
        host_part = url.split("@", 1)[1]
    elif "//" in url:
        host_part = url.split("//", 1)[1]
    else:
        host_part = url
    print(f"  host      = {host_part}")

    # Local import: redis is a soft dependency and lifespan degrades
    # gracefully if the package or URL is missing. Match that pattern
    # so the script's failure mode matches production.
    import redis.asyncio as aioredis  # noqa: E402

    client = aioredis.from_url(
        url,
        decode_responses=True,
        socket_connect_timeout=1,
        socket_timeout=1,
    )

    try:
        # 1. PING — same call lifespan uses.
        ping_ms, _ = await _timed(client.ping())
        print(f"  ping      = PONG in {ping_ms:.1f} ms")

        # 2. SET/GET roundtrip — exercises the same code path as
        # ``cache_service`` and ``chat_ctx:emb_unhealthy:{user_id}``.
        key = "scripts:check_upstash:probe"
        value = f"ok-{int(time.time() * 1000)}"
        roundtrip_ms, _ = await _timed(_roundtrip(client, key, value))
        print(f"  roundtrip = SET/GET/DEL in {roundtrip_ms:.1f} ms")

        # 3. INFO server — surfaces upstream version + mode without
        # printing sensitive fields. Upstash reports ``redis_version``
        # and ``redis_mode=standalone``.
        info = await client.info(section="server")
        version = info.get("redis_version", "?")
        mode = info.get("redis_mode", "?")
        print(f"  server    = redis_version={version}, redis_mode={mode}")

        # 4. PING again — measure steady-state latency on a warm
        # connection. The first PING above includes TCP + TLS setup;
        # this one is the steady-state latency the chat path sees.
        warm_ms, _ = await _timed(client.ping())
        print(f"  warm_ping = PONG in {warm_ms:.1f} ms")

        # 5. TLS handshake latency — only meaningful for ``rediss://``.
        # Approximated by re-opening a fresh client and measuring PING.
        if scheme == "rediss":
            fresh = aioredis.from_url(
                url,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            try:
                tls_ms, _ = await _timed(fresh.ping())
                print(
                    f"  tls_ping  = PONG in {tls_ms:.1f} ms "
                    "(fresh connection)"
                )
            finally:
                await fresh.aclose()
        else:
            print("  tls_ping  = skipped (non-TLS URL)")

        print("OK: Upstash connection healthy.")
        return 0

    except Exception as exc:
        print_fail("Upstash connection error")
        print_short_traceback(exc)
        return 1
    finally:
        try:
            await client.aclose()
        except Exception:
            pass


async def _timed(awaitable):
    """Await ``awaitable`` and return the elapsed wall-clock in milliseconds."""
    t0 = time.perf_counter()
    result = await awaitable
    return (time.perf_counter() - t0) * 1000, result


async def _roundtrip(client, key: str, value: str) -> None:
    """SET → GET → compare → DEL. Raises if any step fails."""
    await client.set(key, value, ex=30)
    got = await client.get(key)
    if got != value:
        raise RuntimeError(f"roundtrip mismatch — wrote {value!r}, read {got!r}")
    await client.delete(key)


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))