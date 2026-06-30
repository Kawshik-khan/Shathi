"""P1 1.2 — ``token_version`` claim + rotation tests.

Three guarantees:

1. ``issue_token_pair`` stamps the ``tv`` claim with the user id's
   current ``token_version`` (so login + Google + refresh all carry
   the same shape).
2. ``User.token_version`` exists with default 0 and is incremented
   on every successful password change.
3. ``dependencies.get_current_user`` rejects tokens whose ``tv`` is
   older than the user's current ``token_version``.

The dependency tests use a FakeUser + direct ``decode_token`` shim
so they stay hermetic — no live DB, no TestClient lifespan dance.
"""
from __future__ import annotations

import asyncio
from typing import Any

import pytest

from app.core.security import (
    TOKEN_VERSION_CLAIM,
    decode_token,
    issue_token_pair,
)
from app.models.user import User
from app.services.user import update_user_password


# --- 1. issue_token_pair stamps tv --------------------------------------------


def test_issue_token_pair_stamps_tv_claim():
    access, refresh = issue_token_pair("user-123", token_version=7)
    ap, _ = decode_token(access)
    rp, _ = decode_token(refresh)
    assert ap[TOKEN_VERSION_CLAIM] == 7
    assert rp[TOKEN_VERSION_CLAIM] == 7
    assert ap["sub"] == "user-123"
    assert rp["sub"] == "user-123"


def test_issue_token_pair_handles_string_token_version():
    """Defensive: token_version may arrive as a string from legacy
    callers. Coerce to int so a stale INSERT can't encode ``"0"``
    while the DB column is integer 0."""
    access, _ = issue_token_pair("user-x", token_version="3")
    payload, _ = decode_token(access)
    assert payload[TOKEN_VERSION_CLAIM] == 3
    assert isinstance(payload[TOKEN_VERSION_CLAIM], int)


# --- 2. User model + update_user_password bump ------------------------------


def test_user_model_has_token_version_default_zero():
    """The model surface must declare ``token_version`` so SQLAlchemy
    creates the column on fresh databases and Alembic can target it
    by name on existing ones."""
    # Inspect the mapped columns on the live class.
    cols = {c.key for c in User.__table__.columns}
    assert "token_version" in cols
    col = User.__table__.columns["token_version"]
    # Default at construction (used when the ORM builds an INSERT).
    default = col.default.arg if col.default is not None else None
    assert default == 0
    assert col.nullable is False


def test_update_user_password_bumps_token_version(monkeypatch):
    """A successful password change MUST rotate the tv.

    We don't spin up a real DB session; we replace ``db.commit`` /
    ``db.refresh`` on a SimpleNamespace so the function thinks the
    row was persisted and the column was bumped. This catches the
    regression where ``update_user_password`` forgot to touch the
    column — the single most important invariant of P1 1.2.
    """
    from types import SimpleNamespace

    class _FakeUser:
        def __init__(self) -> None:
            self.hashed_password = "old-hash"
            self.token_version = 4  # pretend the user already rotated once

    user = _FakeUser()
    called = {"commit": 0}

    async def _commit():
        called["commit"] += 1

    async def _run():
        ok = await update_user_password(
            db=SimpleNamespace(commit=_commit),  # type: ignore[arg-type]
            user=user,
            current_password="irrelevant",
            new_password="irrelevant",
        )
        return ok

    # Patch verify_password / get_password_hash to short-circuit so the
    # success path is taken without touching passlib.
    monkeypatch.setattr(
        "app.services.user.verify_password",
        lambda plain, hashed: True,
    )
    monkeypatch.setattr(
        "app.services.user.get_password_hash",
        lambda plain: "new-hash",
    )

    ok = asyncio.run(_run())
    assert ok is True
    assert user.hashed_password == "new-hash"
    assert user.token_version == 5
    assert called["commit"] == 1


def test_update_user_password_does_not_bump_on_bad_current(monkeypatch):
    """If the current-password check fails we MUST leave ``token_version``
    alone — otherwise an attacker who can guess the *current* password
    (but can't yet prove ownership of the new one) can lock the real
    user out by repeatedly hitting the endpoint."""
    from types import SimpleNamespace

    class _FakeUser:
        token_version = 9
        hashed_password = "old-hash"

    user = _FakeUser()

    async def _run():
        return await update_user_password(
            db=SimpleNamespace(commit=lambda: None),  # type: ignore[arg-type]
            user=user,
            current_password="wrong",
            new_password="doesnt-matter",
        )

    monkeypatch.setattr(
        "app.services.user.verify_password",
        lambda plain, hashed: False,
    )
    monkeypatch.setattr(
        "app.services.user.get_password_hash",
        lambda plain: "x",
    )

    ok = asyncio.run(_run())
    assert ok is False
    assert user.token_version == 9


# --- 3. get_current_user rejects stale tv -----------------------------------


def _build_user(tv: int) -> Any:
    """Fake user object that quacks like the real ``User`` for the bits
    of ``dependencies._enforce_token_version`` that matter."""

    class _FakeUser:
        id = "user-1"
        is_active = True
        token_version = tv

    return _FakeUser()


def test_enforce_token_version_rejects_stale_tv():
    """A token issued with ``tv=0`` for a user whose column is now
    ``token_version=1`` must be rejected with 401.

    ``_enforce_token_version`` is extracted precisely so it can be
    tested without a live DB / FastAPI app / Depends wiring — it's
    the entire reason this code lives in its own function.
    """
    from fastapi import HTTPException

    from app.core.dependencies import _enforce_token_version

    stale_payload = {"sub": "user-1", "type": "access", TOKEN_VERSION_CLAIM: 0}
    user = _build_user(tv=1)

    with pytest.raises(HTTPException) as exc_info:
        _enforce_token_version(user, stale_payload)
    assert exc_info.value.status_code == 401
    assert "Session invalidated" in str(exc_info.value.detail)


def test_enforce_token_version_accepts_matching_tv():
    from app.core.dependencies import _enforce_token_version

    payload = {"sub": "user-1", "type": "access", TOKEN_VERSION_CLAIM: 4}
    user = _build_user(tv=4)
    # Should not raise.
    _enforce_token_version(user, payload)


def test_enforce_token_version_rejects_missing_claim():
    """Legacy tokens (issued before this column shipped) have no ``tv``
    claim at all. Such tokens must be treated as stale — better to
    force a re-login than to silently let pre-migration tokens
    continue to work in perpetuity."""
    from fastapi import HTTPException

    from app.core.dependencies import _enforce_token_version

    legacy_payload = {"sub": "user-1", "type": "access"}  # no tv
    user = _build_user(tv=0)

    with pytest.raises(HTTPException) as exc_info:
        _enforce_token_version(user, legacy_payload)
    assert exc_info.value.status_code == 401


def test_enforce_token_version_no_op_on_empty_payload():
    """If the caller already concluded the token is broken (e.g. missing
    sig) it may pass ``payload=None``. The dedicated 401 for that case
    is raised by ``_load_user_from_token``, not us — this helper must
    not double-report."""

    from app.core.dependencies import _enforce_token_version

    user = _build_user(tv=0)
    # Should not raise.
    _enforce_token_version(user, None)
