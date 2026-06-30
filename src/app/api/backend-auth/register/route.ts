import { NextResponse, type NextRequest } from "next/server";
import { BackendAuthError, fetchBackendAuth } from "@/lib/server/backend-auth";
import { setAuthCookies, tokensToCookieInput } from "@/lib/server/auth-cookies";
import type { TokenResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const tokens = await fetchBackendAuth<TokenResponse>(
      "/api/v1/auth/register",
      payload,
      "Credentials backend registration",
    );

    return setAuthCookies(NextResponse.json(tokens), tokensToCookieInput(tokens));
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return NextResponse.json({ detail: error.detail }, { status: error.status });
    }
    return NextResponse.json({ detail: "Registration failed" }, { status: 500 });
  }
}
