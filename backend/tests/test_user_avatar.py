"""Tests for avatar validation + storage helpers in app.services.user_avatar."""

from __future__ import annotations

import io

import pytest
from fastapi import HTTPException, UploadFile

from app.core.config import get_settings
from app.services.user_avatar import (
    _sniff_mime,
    delete_avatar_files,
    read_and_validate_avatar,
    save_avatar,
)


# Hand-crafted magic-byte payloads so the test data is self-contained.
JPEG_BYTES = bytes([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x00, 0x01]) + b"\x00" * 8
PNG_BYTES = (
    bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) + b"\x00" * 8
)
WEBP_BYTES = (
    b"RIFF"
    + b"\x00\x00\x00\x00"  # size placeholder
    + b"WEBP"
    + b"VP8 "
    + b"\x00" * 8
)
TEXT_BYTES = b"hello, this is plain text, not an image at all"
EMPTY_BYTES = b""


def _upload(blob: bytes, declared_type: str | None = "image/jpeg") -> UploadFile:
    """Build an UploadFile wrapper around an in-memory byte payload."""
    return UploadFile(
        filename="avatar.bin",
        file=io.BytesIO(blob),
        headers={"content-type": declared_type} if declared_type else None,
    )


def test_sniff_mime_jpeg():
    ext, mime = _sniff_mime(JPEG_BYTES)
    assert ext == "jpg"
    assert mime == "image/jpeg"


def test_sniff_mime_png():
    ext, mime = _sniff_mime(PNG_BYTES)
    assert ext == "png"
    assert mime == "image/png"


def test_sniff_mime_webp():
    ext, mime = _sniff_mime(WEBP_BYTES)
    assert ext == "webp"
    assert mime == "image/webp"


def test_sniff_mime_rejects_text():
    with pytest.raises(HTTPException) as exc:
        _sniff_mime(TEXT_BYTES)
    assert exc.value.status_code == 415


def test_sniff_mime_rejects_empty():
    with pytest.raises(HTTPException):
        _sniff_mime(EMPTY_BYTES)


def test_sniff_mime_rejects_too_short():
    """Sniffer must raise on data that can't possibly match a known signature."""
    with pytest.raises(HTTPException):
        _sniff_mime(b"\xff\xd8")


@pytest.mark.asyncio
async def test_read_and_validate_accepts_jpeg():
    blob, ext, mime = await read_and_validate_avatar(_upload(JPEG_BYTES))
    assert ext == "jpg"
    assert mime == "image/jpeg"
    assert blob.startswith(b"\xff\xd8")


@pytest.mark.asyncio
async def test_read_and_validate_accepts_png():
    _, ext, mime = await read_and_validate_avatar(_upload(PNG_BYTES, "image/png"))
    assert ext == "png"
    assert mime == "image/png"


@pytest.mark.asyncio
async def test_read_and_validate_accepts_webp():
    _, ext, mime = await read_and_validate_avatar(_upload(WEBP_BYTES, "image/webp"))
    assert ext == "webp"
    assert mime == "image/webp"


@pytest.mark.asyncio
async def test_read_and_validate_rejects_disguised_text():
    """A blob that *says* image/jpeg but isn't one must be rejected."""
    with pytest.raises(HTTPException) as exc:
        await read_and_validate_avatar(_upload(TEXT_BYTES, "image/jpeg"))
    # MIME header check passes (declared == allowed), so the sniffer fires
    # and raises 415 — not 400.
    assert exc.value.status_code == 415


@pytest.mark.asyncio
async def test_read_and_validate_rejects_unsupported_type():
    with pytest.raises(HTTPException) as exc:
        await read_and_validate_avatar(_upload(JPEG_BYTES, "image/gif"))
    assert exc.value.status_code == 415


@pytest.mark.asyncio
async def test_read_and_validate_rejects_oversized(tmp_path, monkeypatch):
    """Pushing past AVATAR_MAX_BYTES must 413 before reading the whole stream."""
    settings = get_settings()
    monkeypatch.setattr(settings, "AVATAR_MAX_BYTES", 16)
    # Build a payload that looks like a JPEG but is well past the cap.
    payload = JPEG_BYTES + b"\x00" * 64
    with pytest.raises(HTTPException) as exc:
        await read_and_validate_avatar(_upload(payload, "image/jpeg"))
    assert exc.value.status_code == 413


@pytest.mark.asyncio
async def test_read_and_validate_rejects_empty():
    with pytest.raises(HTTPException) as exc:
        await read_and_validate_avatar(_upload(b"", "image/jpeg"))
    assert exc.value.status_code == 400


def test_save_avatar_writes_file_and_returns_public_url(tmp_path, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "AVATAR_STORAGE_DIR", str(tmp_path / "avatars"))
    monkeypatch.setattr(settings, "AVATAR_PUBLIC_BASE_URL", "/static/avatars")

    url = save_avatar("user-42", JPEG_BYTES, "jpg")

    assert url == "/static/avatars/user-42.jpg"
    written = tmp_path / "avatars" / "user-42.jpg"
    assert written.exists()
    assert written.read_bytes() == JPEG_BYTES


def test_save_avatar_overwrites_existing(tmp_path, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "AVATAR_STORAGE_DIR", str(tmp_path / "avatars"))

    save_avatar("user-7", JPEG_BYTES, "jpg")
    save_avatar("user-7", PNG_BYTES, "png")

    # The png variant must be present and the jpg must be gone — we don't
    # leave stale variants lying around when the format changes.
    assert (tmp_path / "avatars" / "user-7.png").exists()
    assert not (tmp_path / "avatars" / "user-7.jpg").exists()


def test_delete_avatar_files_removes_all_variants(tmp_path, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "AVATAR_STORAGE_DIR", str(tmp_path / "avatars"))

    save_avatar("user-99", JPEG_BYTES, "jpg")
    save_avatar("user-99", PNG_BYTES, "png")

    delete_avatar_files("user-99")

    remaining = list((tmp_path / "avatars").iterdir())
    assert remaining == []


def test_delete_avatar_files_handles_missing_user(tmp_path, monkeypatch):
    """No files for this user_id must not raise."""
    settings = get_settings()
    monkeypatch.setattr(settings, "AVATAR_STORAGE_DIR", str(tmp_path / "avatars"))
    delete_avatar_files("user-never-existed")  # never written