"""Shared bootstrap for the connectivity-check scripts.

Three concerns handled here, so each script can stay focused on its
single dependency:

1. Make ``backend/`` importable so ``app.core.config.get_settings()``
   works when the script is invoked as ``python scripts/check_*.py``
   from any cwd.
2. Provide a small helper to print a section header consistently.
3. Provide a shared stderr-only ``print_fail`` for failure lines so
   operators can grep them out of CI logs.
4. Provide ``print_short_traceback`` — a noise-trimmed traceback
   printer. Full ``traceback.print_exc()`` buries operators in
   ``redis-py``/``pinecone``/``asyncio`` internal frames; we keep
   the originating exception line and the last 3 frames so the
   caller knows which script call site fired.

Nothing in this module touches the network.
"""
from __future__ import annotations

import sys
import traceback
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Frame filename markers that are always internal plumbing and
# should be trimmed from the traceback tail. Checked via
# ``in filename`` so they match both absolute (Windows) and
# relative (POSIX) paths regardless of cwd.
_NOISE_MARKERS = (
    "asyncio/",
    "asyncio\\",
    "concurrent/futures",
    "redis/asyncio/",
    "redis\\asyncio\\",
    "site-packages/httpx",
    "site-packages\\httpx",
    "pinecone/",
    "pinecone\\",
)


def _is_noise_frame(filename: str) -> bool:
    return any(marker in filename for marker in _NOISE_MARKERS)


def section(title: str, width: int = 64) -> None:
    """Print a centered section header to stdout."""
    bar = "=" * width
    print(bar)
    print(title)
    print(bar)


def print_fail(message: str) -> None:
    """Print a ``FAIL:`` line to stderr (one per failure cause)."""
    print(f"FAIL: {message}", file=sys.stderr)


def print_short_traceback(exc: BaseException | None = None) -> None:
    """Print the exception type + message and the last 3 non-noise frames.

    Falls back to ``traceback.print_exc()`` if anything goes wrong here.
    """
    if exc is None:
        exc = sys.exc_info()[1]
    try:
        tb = traceback.extract_tb(sys.exc_info()[2] or exc.__traceback__)
        # Keep only frames whose filename isn't internal plumbing.
        frames = [f for f in tb if not _is_noise_frame(f.filename)]
        tail = frames[-3:] if frames else tb[-3:]
        print(f"  {type(exc).__name__}: {exc}", file=sys.stderr)
        for f in tail:
            print(
                f"    at {f.filename}:{f.lineno} in {f.name}",
                file=sys.stderr,
            )
    except Exception:
        traceback.print_exc()


__all__ = [
    "BACKEND_DIR",
    "section",
    "print_fail",
    "print_short_traceback",
]
