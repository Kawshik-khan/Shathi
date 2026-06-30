/**
 * P1 1.3 — HttpOnly auth-cookie helper.
 *
 * The browser holds the access token in an HttpOnly cookie so JavaScript on
 * the page cannot read it (mitigates XSS-driven token theft). The cookie is
 * scoped, hardened, and rotated on every successful /api/auth/refresh call.
 *
 *   sathi_at  →  access token.  SameSite=Lax, Path=/,                 Max-Age = ACCESS_TOKEN_MAX_AGE_S
 *   sathi_rt  →  refresh token. SameSite=Strict, Path=/api/backend-auth, Max-Age = REFRESH_TOKEN_MAX_AGE_S
 *
 * Scoping the refresh cookie to the BFF route is intentional: the JWT is
 * never visible to the page (HttpOnly) and never sent on cross-origin
 * requests or chat/journal fetches (Path-scoped + SameSite=Strict).
 *
 * The cookie attributes used here must match the verification path in
 * proxy.ts — see that file's comment for the per-cookie contract.
 */
import { NextResponse } from "next/server";

export const SATHI_ACCESS_COOKIE = "sathi_at";
export const SATHI_REFRESH_COOKIE = "sathi_rt";

/** Access token lifetime in seconds. Must match the FastAPI ``ACCESS_TOKEN_EXPIRE_MINUTES`` setting. */
export const ACCESS_TOKEN_MAX_AGE_S = 30 * 60; // 30 minutes
/** Refresh token lifetime in seconds. Must match the FastAPI ``REFRESH_TOKEN_EXPIRE_DAYS`` setting. */
export const REFRESH_TOKEN_MAX_AGE_S = 7 * 24 * 60 * 60; // 7 days

/** Path-scoped refresh cookie: only ever sent to /api/backend-auth. */
const REFRESH_COOKIE_PATH = "/api/backend-auth";

/**
 * Whether cookies should set the ``Secure`` flag. Production deployments are
 * served over HTTPS, so we always set it there. In dev (HTTP) the flag
 * would be rejected by the browser, so we omit it.
 */
function isSecureContext(): boolean {
  return process.env.NODE_ENV === "production";
}

export interface SetAuthCookiesInput {
  accessToken: string;
  refreshToken: string;
}

/**
 * Adapter from the FastAPI ``TokenResponse`` (snake_case) into the
 * ``SetAuthCookiesInput`` shape used by the cookie helper. Accepts
 * either snake_case or camelCase fields so callers that already
 * normalised the payload don't have to.
 */
export function tokensToCookieInput(tokens: {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
}): SetAuthCookiesInput {
  const accessToken = tokens.accessToken ?? tokens.access_token;
  const refreshToken = tokens.refreshToken ?? tokens.refresh_token;
  if (!accessToken || !refreshToken) {
    throw new Error("Cannot set auth cookies: missing access or refresh token");
  }
  return { accessToken, refreshToken };
}

/**
 * Attach the access + refresh cookies to a NextResponse. The tokens are
 * never echoed back to JavaScript — the browser receives them only via the
 * Set-Cookie header, and from that point on the HttpOnly flag prevents
 * page-side reads.
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: SetAuthCookiesInput,
): NextResponse {
  const secure = isSecureContext();

  response.cookies.set(SATHI_ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_S,
  });

  response.cookies.set(SATHI_REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    // Strict: the refresh token must never ride on top-level navigations
    // or cross-site requests. The BFF refresh endpoint is a same-origin
    // POST, so Strict is the right value here.
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_MAX_AGE_S,
  });

  return response;
}

/**
 * Clear both cookies — used on logout and on any 401 from the BFF. The
 * shape (HttpOnly, Secure, SameSite) must match the *set* call so the
 * browser actually deletes them instead of storing a stale copy.
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  const secure = isSecureContext();

  for (const name of [SATHI_ACCESS_COOKIE, SATHI_REFRESH_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: name === SATHI_ACCESS_COOKIE ? "lax" : "strict",
      path: name === SATHI_ACCESS_COOKIE ? "/" : REFRESH_COOKIE_PATH,
      maxAge: 0,
    });
  }

  // Also kill the legacy ``sathi_auth=1`` sentinel that 1.1 used to read.
  // Without this, an attacker who lands a stale ``sathi_auth=1`` on a
  // browser would keep that presence-check passing until the cookie's
  // Max-Age expired.
  response.cookies.set("sathi_auth", "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}