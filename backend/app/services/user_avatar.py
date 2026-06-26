"""Avatar upload + storage helpers.

We avoid Pillow as a dependency: validation is done by magic-byte sniffing
plus a hard size cap. Files land in ``AVATAR_STORAGE_DIR`` and are served
through the ``/static/avatars`` FastAPI mount wired up in ``app.main``.

If Supabase Storage credentials are present (the admin can configure them
later) we can switch the sink by replacing ``save_avatar`` with a Supabase
upload call — the public URL is the only contract the caller relies on.
"""
from __future__ import annotations

import io
import os
import uuid
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

# Magic-byte signatures we accept. Anything else is rejected.
_MAGIC: dict[bytes, Tuple[str, str]] = {
    b"\xff\xd8\xff": ("jpg", "image/jpeg"),
    b"\x89PNG\r\n\x1a\n": ("png", "image/png"),
    b"RIFF": ("webp", "image/webp"),  # WEBP: "RIFF????WEBP"
}

_WEBP_TAIL = b"WEBP"


def _sniff_mime(blob: bytes) -> Tuple[str, str]:
    """Return ``(extension, mime_type)`` from magic bytes, or raise 415."""
    for prefix, (ext, mime) in _MAGIC.items():
        if blob.startswith(prefix):
            if mime == "image/webp":
                # WEBP needs the trailing WEBP marker to disambiguate from RIFF/WAV.
                if not blob[8:12].startswith(_WEBP_TAIL):
                    continue
            return ext, mime

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Avatar must be a JPEG, PNG, or WEBP image.",
    )


async def read_and_validate_avatar(file: UploadFile) -> Tuple[bytes, str, str]:
    """Read the upload, enforce size and MIME, and return ``(bytes, ext, mime)``."""
    settings = get_settings()
    allowed = {m.strip().lower() for m in settings.AVATAR_ALLOWED_MIME.split(",") if m.strip()}

    if file.content_type and file.content_type.lower() not in allowed:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Content-Type {file.content_type!r} is not allowed.",
        )

    blob = await file.read(settings.AVATAR_MAX_BYTES + 1)
    if len(blob) > settings.AVATAR_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Avatar must be {settings.AVATAR_MAX_BYTES // (1024 * 1024)} MiB or smaller.",
        )
    if len(blob) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar file is empty.",
        )

    ext, mime = _sniff_mime(blob)
    if mime not in allowed:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Detected MIME {mime!r} is not allowed.",
        )

    return blob, ext, mime


def storage_root() -> Path:
    """Return the directory where avatars are written. Created on demand."""
    settings = get_settings()
    root = Path(settings.AVATAR_STORAGE_DIR)
    if not root.is_absolute():
        root = Path(os.getcwd()) / root
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_avatar(user_id: str, blob: bytes, ext: str) -> str:
    """Persist ``blob`` for ``user_id`` and return the public URL.

    One canonical file per user — re-uploads overwrite. When the format
    changes (e.g. jpg -> png) the previous variant is removed so we don't
    leak stale files on disk.
    """
    settings = get_settings()
    root = storage_root()
    target = root / f"{user_id}.{ext}"
    target.write_bytes(blob)

    # Sweep any other variants for this user that the new write just
    # superseded. ``delete_avatar_files`` swallows per-file errors.
    for sibling in root.glob(f"{user_id}.*"):
        if sibling != target:
            try:
                sibling.unlink()
            except OSError:
                pass

    base = settings.AVATAR_PUBLIC_BASE_URL.rstrip("/")
    return f"{base}/{user_id}.{ext}"


def delete_avatar_files(user_id: str) -> None:
    """Best-effort cleanup of every avatar file we wrote for ``user_id``."""
    root = storage_root()
    for child in root.glob(f"{user_id}.*"):
        try:
            child.unlink()
        except OSError:
            # Storage hiccups shouldn't break the caller.
            pass