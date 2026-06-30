import { NextResponse, type NextRequest } from "next/server";
import { BackendAuthError, fetchBackendAuth } from "@/lib/server/backend-auth";
import { setAuthCookies, tokensToCookieInput } from "@/lib/server/auth-cookies";
import type { TokenResponse } from "@/types";

/**
 * P1 1.3: Google sign-in flows through Auth.js (which exchanges Google's
 * own ID token with the FastAPI ``/api/v1/auth/google-callback`` endpoint).
 * After we have the FastAPI ``TokenResponse`` here, we mint HttpOnly
 * ``sathi_at`` / ``sathi_rt`` cookies on the same response so subsequent
 * requests through the BFF proxy carry them automatically.
 *
 * The body shape matches ``TokenResponse`` (access_token, refresh_token,
 * expires_in, user).
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    if (!payload?.access_token || !payload?.refresh_token) {
      return NextResponse.json({ detail: "Missing tokens in request" }, { status: 400 });
    }

    const tokens: TokenResponse = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      token_type: "bearer",
      expires_in: payload.expires_in ?? 1800,
    };

    return setAuthCookies(NextResponse.json(tokens), tokensToCookieInput(tokens));
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return NextResponse.json({ detail: error.detail }, { status: error.status });
    }
    return NextResponse.json({ detail: "Google session cookie issue failed" }, { status: 500 });
  }
}
