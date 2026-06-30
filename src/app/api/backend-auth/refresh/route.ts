import { NextResponse } from "next/server";
import {
  BackendAuthError,
  fetchBackendAuth,
} from "@/lib/server/backend-auth";
import {
  SATHI_REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
  tokensToCookieInput,
} from "@/lib/server/auth-cookies";
import type { TokenResponse } from "@/types";

/**
 * POST /api/backend-auth/refresh
 *
 * Reads ``sathi_rt`` from the request cookies (the browser already sent
 * it because the request targets this path; the cookie is HttpOnly so
 * the page-side caller can't forge it), exchanges it with the backend
 * for a fresh access/refresh pair, and re-issues both cookies.
 *
 * No body is required: the refresh token lives only in the cookie.
 * On failure we clear both auth cookies so the proxy.ts redirect kicks
 * in on the next protected-route request.
 */
export async function POST(request: Request) {
  const cookies = (request.headers as Headers).get("cookie") ?? "";
  const refreshCookie = readCookie(cookies, SATHI_REFRESH_COOKIE);

  if (!refreshCookie) {
    return clearAuthCookies(
      NextResponse.json({ detail: "No refresh token" }, { status: 401 }),
    );
  }

  try {
    const tokens = await fetchBackendAuth<TokenResponse>(
      "/api/v1/auth/refresh",
      { refresh_token: refreshCookie },
      "Backend token refresh",
    );

    // The response carries a user object (used by the client store to
    // refresh the displayed profile) but no token body — the cookies
    // are the only carrier now.
    return setAuthCookies(NextResponse.json(tokens), tokensToCookieInput(tokens));
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return clearAuthCookies(
        NextResponse.json({ detail: error.detail }, { status: error.status }),
      );
    }
    return clearAuthCookies(
      NextResponse.json({ detail: "Refresh failed" }, { status: 500 }),
    );
  }
}

/** Minimal cookie parser scoped to a single name. Avoids pulling in a
 *  cookie library for one field. */
function readCookie(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  for (const segment of cookieHeader.split(";")) {
    const trimmed = segment.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return null;
}