/**
 * P1 1.1 — Edge-runtime JWT verification helper.
 *
 * The proxy.ts file (which runs on Vercel's Edge network) does NOT have
 * access to ``python-jose`` or any Node-only crypto APIs. We rely on the
 * Web Crypto API (``crypto.subtle``) which the Edge runtime exposes.
 *
 * The FastAPI backend signs access tokens with HS256 + SECRET_KEY (see
 * ``backend/app/core/security.py::create_access_token``). The same key
 * is mirrored to the edge via the ``AUTH_PROXY_VERIFY_KEY`` env var so
 * the proxy can reject forged/expired tokens without round-tripping to
 * the backend. The backend still re-verifies on every API call — the
 * proxy check is a fast-path / fail-closed gate.
 *
 * Only the EDGE entry-point should import this module. The rest of the
 * app must continue to use the backend's decode_token for authorisation
 * decisions.
 */

export interface VerifiedTokenClaims {
  sub: string;
  /** Token-version claim — compared against the DB row in the backend. */
  tv: number;
  exp: number;
  iat?: number;
  type?: string;
}

export type VerifyTokenResult =
  | { ok: true; claims: VerifiedTokenClaims }
  | { ok: false; reason: string };

/**
 * Base64URL → Uint8Array decoder. JWT spec uses ``-_`` and ``_`` (not
 * ``+/`` / ``/``) so we cannot use plain ``atob`` on the signature /
 * signature base64 inputs.
 */
function base64UrlDecode(input: string): Uint8Array {
  const padding = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = typeof atob === "function"
    ? atob(base64)
    : // Buffer fallback in Node — Edge runtime exposes global ``atob``.
      "";
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeJson<T>(input: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(input))) as T;
}

/**
 * Copy a Uint8Array's bytes into a fresh ``ArrayBuffer`` so the
 * Edge-runtime ``crypto.subtle.verify`` accepts the buffer (it requires
 * a strict ``ArrayBuffer``, not ``SharedArrayBuffer``).
 */
function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(view.byteLength);
  new Uint8Array(out).set(view);
  return out;
}

/**
 * Verify an HS256 JWT signature + ``exp`` and return the claims. The
 * ``keyMaterial`` MUST be a string of at least 32 bytes; production is
 * expected to provide a 32-byte (or longer) random secret mirrored from
 * the backend's ``SECRET_KEY``.
 *
 * This function NEVER throws — it returns a tagged result so callers
 * can decide whether to redirect, set hint headers, etc.
 */
export async function verifyHs256Jwt(
  token: string,
  keyMaterial: string,
): Promise<VerifyTokenResult> {
  if (!token) {
    return { ok: false, reason: "missing_token" };
  }
  if (!keyMaterial || keyMaterial.length < 16) {
    // Refuse to even attempt verification with a short / unset key.
    return { ok: false, reason: "missing_key" };
  }

  const segments = token.split(".");
  if (segments.length !== 3) {
    return { ok: false, reason: "malformed" };
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;
  let header: { alg?: string; typ?: string };
  let payload: { sub?: string; tv?: number; exp?: number; iat?: number; type?: string };
  try {
    header = base64UrlDecodeJson<{ alg?: string; typ?: string }>(headerSegment);
    payload = base64UrlDecodeJson<typeof payload>(payloadSegment);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (header.alg !== "HS256") {
    return { ok: false, reason: "alg_mismatch" };
  }
  if (!payload.sub || typeof payload.tv !== "number") {
    return { ok: false, reason: "missing_required_claims" };
  }

  // ``crypto.subtle.importKey`` + ``verify`` for HMAC-SHA-256.
  const signingInput = new TextEncoder().encode(`${headerSegment}.${payloadSegment}`);
  const signature = base64UrlDecode(signatureSegment);
  const keyBytes = new TextEncoder().encode(keyMaterial);

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    return { ok: false, reason: "key_import_failed" };
  }

  let verified = false;
  try {
    const signatureBuffer = toArrayBuffer(signature);
    const signingInputBuffer = toArrayBuffer(signingInput);
    verified = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      signingInputBuffer,
    );
  } catch {
    return { ok: false, reason: "verify_failed" };
  }

  if (!verified) {
    // ``crypto.subtle.verify`` already runs in constant time internally,
    // but we still refuse to act on a mismatch.
    return { ok: false, reason: "bad_signature" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= nowSeconds) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    claims: {
      sub: String(payload.sub),
      tv: Number(payload.tv),
      exp: Number(payload.exp),
      iat: typeof payload.iat === "number" ? payload.iat : undefined,
      type: payload.type,
    },
  };
}

/**
 * Read the verify key. We deliberately fail-closed if production is
 * missing the env var — we DO NOT fall back to the next-auth secret in
 * production because leaking that one would also leak NextAuth's
 * session JWT signing key.
 */
export function resolveProxyVerifyKey(): string {
  const isProd = process.env.VERCEL_ENV === "production";
  const key =
    process.env.AUTH_PROXY_VERIFY_KEY ??
    process.env.SECRET_KEY ??
    process.env.NEXTAUTH_SECRET ??
    "";

  if (isProd && (!key || key.length < 32)) {
    throw new Error(
      "AUTH_PROXY_VERIFY_KEY (or SECRET_KEY) must be set to a 32+ character value in production",
    );
  }
  return key;
}