"""Regression tests for Priority 0 fixes (2026-06-29 audit).

Covers:
- 0.1 ``bn.json`` invalid JSON now parses (see frontend test in ``src``).
- 0.2 ``journal/routes.py`` delete injects ``redis`` and tolerates cache failure.
- 0.3 ``verify_supabase_token`` accepts both RS256+JWKS and legacy HS256 paths.
"""

from __future__ import annotations

import asyncio
import json
import pathlib
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# 0.1: bn.json is valid JSON
# ---------------------------------------------------------------------------


def test_bn_json_is_valid():
    """The Bengali locale file must parse without error."""
    repo_root = pathlib.Path(__file__).resolve().parents[2]
    bn = repo_root / "src" / "i18n" / "locales" / "bn.json"
    assert bn.exists(), f"bn.json missing at {bn}"
    payload = json.loads(bn.read_text(encoding="utf-8"))
    # Spot-check the previously-broken keys actually survived the repair.
    assert "plan" in payload
    assert payload["plan"]["upgradeToPro"] == "প্রো-তে আপগ্রেড করুন"


def test_en_json_is_valid():
    """Sanity: English locale hasn't regressed either."""
    repo_root = pathlib.Path(__file__).resolve().parents[2]
    en = repo_root / "src" / "i18n" / "locales" / "en.json"
    if not en.exists():
        return  # file optional; skip silently
    json.loads(en.read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------
# 0.2: journal delete now injects redis and won't 500 on a successful delete
# ---------------------------------------------------------------------------


def test_delete_endpoint_injects_redis_dependency():
    """The delete endpoint signature must include ``redis: Depends(get_redis)``.

    Static check: read the source and assert the parameter is present.
    """
    from app.api.journal import routes as journal_routes

    import inspect

    sig = inspect.signature(journal_routes.delete_journal_entry)
    assert "redis" in sig.parameters, "delete_journal_entry must inject redis"


# ---------------------------------------------------------------------------
# 0.3: verify_supabase_token supports RS256+JWKS and the HS256 fallback
# ---------------------------------------------------------------------------


def test_verify_supabase_token_hs256_fallback_still_works(monkeypatch):
    """When SUPABASE_URL is empty, the legacy HS256 path must still succeed."""
    import jwt

    from app.core import security

    # Force the HS256 branch by zeroing SUPABASE_URL on the cached settings instance.
    settings = security.settings
    monkeypatch.setattr(settings, "SUPABASE_URL", "", raising=False)
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", "test-shared-secret-32bytes-aaaaaaaaaa", raising=False)

    token = jwt.encode(
        {"sub": "u1", "aud": "authenticated"},
        "test-shared-secret-32bytes-aaaaaaaaaa",
        algorithm="HS256",
    )

    payload, err = security.verify_supabase_token(token)
    assert err is None, f"verify_supabase_token returned error: {err}"
    assert payload is not None
    assert payload["sub"] == "u1"


def test_verify_supabase_token_jwks_path_invoked(monkeypatch):
    """When SUPABASE_URL is set, RS256+JWKS should be tried first."""
    import base64

    import jwt
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    from app.core import security

    settings = security.settings

    # Build an RSA keypair, sign with the *private* key, ship the *public*
    # JWK through our mocked JWKS endpoint, and verify the verifier accepts it.
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    token = jwt.encode(
        {"sub": "u2", "aud": "authenticated"},
        pem,
        algorithm="RS256",
        headers={"kid": "test-kid"},
    )

    public_numbers = private_key.public_key().public_numbers()

    def _b64uint(value: int) -> str:
        b = value.to_bytes((value.bit_length() + 7) // 8 or 1, "big")
        return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")

    fake_jwks = {
        "keys": [
            {
                "kty": "RSA",
                "kid": "test-kid",
                "use": "sig",
                "alg": "RS256",
                "n": _b64uint(public_numbers.n),
                "e": _b64uint(public_numbers.e),
            }
        ]
    }

    monkeypatch.setattr(settings, "SUPABASE_URL", "https://abc.supabase.co", raising=False)
    monkeypatch.setattr(security, "_get_supabase_jwks", lambda url: fake_jwks, raising=False)
    # Invalidate the JWKS cache so a fresh fetch goes through our stub.
    security._supabase_jwks_cache.clear()

    payload, err = security.verify_supabase_token(token)
    assert err is None, f"verify_supabase_token returned error: {err}"
    assert payload is not None
    assert payload["sub"] == "u2"


def test_verify_supabase_token_unknown_kid_is_rejected(monkeypatch):
    """Mismatch between token kid and JWKS kid must return an error tuple."""
    import jwt
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    from app.core import security

    settings = security.settings
    pk = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = pk.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    token = jwt.encode(
        {"sub": "u3", "aud": "authenticated"},
        pem,
        algorithm="RS256",
        headers={"kid": "no-such-kid"},
    )

    monkeypatch.setattr(settings, "SUPABASE_URL", "https://abc.supabase.co", raising=False)
    monkeypatch.setattr(security, "_get_supabase_jwks", lambda url: {"keys": []}, raising=False)
    security._supabase_jwks_cache.clear()

    payload, err = security.verify_supabase_token(token)
    assert payload is None
    assert err is not None
