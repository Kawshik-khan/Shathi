import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/server/auth-cookies";

export async function POST() {
  // Clear both auth cookies + the legacy ``sathi_auth`` sentinel so the
  // browser forgets us on the next page load. We don't call the backend
  // here — the backend will see the missing cookie and refuse anyway,
  // and a best-effort logout that fails server-side shouldn't strand
  // the user on a logged-out client.
  return clearAuthCookies(NextResponse.json({ ok: true }));
}
