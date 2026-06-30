import { NextResponse, type NextRequest } from "next/server";
import { BackendAuthError, fetchBackendAuth } from "@/lib/server/backend-auth";
import { setAuthCookies, tokensToCookieInput } from "@/lib/server/auth-cookies";
import type { TokenResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const tokens = await fetchBackendAuth<TokenResponse>(
      "/api/v1/auth/login",
      payload,
      "Credentials backend login",
    );

    // P1 1.3: tokens are now delivered only via HttpOnly cookies. The
    // JSON body still includes ``access_token`` for callers that need it
    // (e.g. tests) but the browser never has to read it from JS — the
    // cookies carry the same value and are sent automatically.
    return setAuthCookies(NextResponse.json(tokens), tokensToCookieInput(tokens));
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return NextResponse.json({ detail: error.detail }, { status: error.status });
    }
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
