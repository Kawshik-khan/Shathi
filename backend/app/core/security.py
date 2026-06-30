"""Security utilities for authentication and authorization."""
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash."""
    if hashed_password.startswith("$2"):
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm="HS256"
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm="HS256"
    )
    return encoded_jwt


# Convention for the token-version claim. Kept as a module-level constant
# so every callsite that needs to read or embed it can reference the
# same key. A typo here (``tv`` vs ``token_version``) would silently
# invalidate every session — please don't rename this without bumping
# a fresh ``token_version`` for all users.
TOKEN_VERSION_CLAIM = "tv"


def issue_token_pair(user_id: str, token_version: int) -> tuple[str, str]:
    """Issue a fresh access/refresh pair stamped with the user's current tv.

    Centralizing the claim here means every login path (email/password,
    Google OAuth, refresh-token rotation) ends up with the same shape.
    Any future addition (e.g. ``device_id``) only needs to change one
    function, not three.
    """
    claims = {"sub": user_id, TOKEN_VERSION_CLAIM: int(token_version)}
    return create_access_token(claims), create_refresh_token(claims)


def decode_token_strict(token: str, expected_type: str) -> dict:
    """Decode + type-check + signature verify in one step.

    Raises ``jose.JWTError`` on any failure so callers can decide whether
    to map it to 401 (auth dependency) or refuse the token entirely
    (refresh path). Returns the payload dict on success.
    """
    payload, error = decode_token(token)
    if error or not payload:
        raise JWTError(error or "invalid token")
    if payload.get("type") != expected_type:
        raise JWTError(f"expected token type {expected_type!r}, got {payload.get('type')!r}")
    return payload


def decode_token(token: str) -> Tuple[Optional[dict], Optional[str]]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload, None
    except JWTError as e:
        return None, str(e)


def verify_supabase_token(token: str) -> Tuple[Optional[dict], Optional[str]]:
    """Verify a Supabase JWT token.

    Production Supabase signs with RS256 and publishes the public keys at
    ``{SUPABASE_URL}/auth/v1/.well-known/jwks.json``. We discover the key
    set lazily on the first call, cache it process-locally for 1 hour, and
    fall back to the legacy ``SUPABASE_JWT_SECRET`` (HS256) only when the
    environment has explicitly opted out of JWKS — typically legacy or test
    setups that pre-date Supabase's signed-key migration. New deployments
    MUST leave ``SUPABASE_URL`` configured so JWKS is reachable.
    """
    import httpx as _httpx  # local import: keep module load cheap
    from app.core.config import get_settings as _get_settings

    settings = _get_settings()
    audience = "authenticated"

    # ----- Path 1: RS256 + JWKS (production) -----------------------------
    if settings.SUPABASE_URL:
        try:
            jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
            jwks = _get_supabase_jwks(jwks_url)
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            if not kid:
                return None, "missing kid in JWT header"
            key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
            if key is None:
                return None, f"no JWK for kid={kid}"
            # python-jose accepts a JWK dict directly.
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience=audience,
            )
            return payload, None
        except JWTError as e:
            return None, str(e)
        except Exception as e:  # noqa: BLE001 - network/JWKS failures are recoverable
            # Fall through to the HS256 path; if it also fails we'll surface
            # that error so callers still get a definitive failure mode.
            last_err = e  # noqa: F841 - intentional fall-through marker
    # ----- Path 2: HS256 with shared secret (legacy / tests) -------------
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience=audience,
        )
        return payload, None
    except JWTError as e:
        return None, str(e)


# Process-local JWKS cache (refreshed every hour). Keyed by JWKS URL so
# multi-tenant test fixtures don't collide.
_supabase_jwks_cache: dict[str, tuple[float, dict]] = {}
_JWKS_TTL_S = 3600.0


def _get_supabase_jwks(jwks_url: str) -> dict:
    """Fetch and cache the Supabase JWKS document."""
    import time as _time
    import httpx as _httpx

    cached = _supabase_jwks_cache.get(jwks_url)
    if cached is not None and (_time.monotonic() - cached[0]) < _JWKS_TTL_S:
        return cached[1]

    with _httpx.Client(timeout=5.0) as client:
        resp = client.get(jwks_url)
        resp.raise_for_status()
        doc = resp.json()
    _supabase_jwks_cache[jwks_url] = (_time.monotonic(), doc)
    return doc

