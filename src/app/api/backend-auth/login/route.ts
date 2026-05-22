import { NextResponse, type NextRequest } from "next/server";
import { BackendAuthError, fetchBackendAuth } from "@/lib/server/backend-auth";
import type { TokenResponse } from "@/types";

const AUTH_COOKIE_NAME = "sathi_auth";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function withAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, "1", {
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const tokens = await fetchBackendAuth<TokenResponse>(
      "/api/v1/auth/login",
      payload,
      "Credentials backend login",
    );

    return withAuthCookie(NextResponse.json(tokens));
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return NextResponse.json({ detail: error.detail }, { status: error.status });
    }
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
