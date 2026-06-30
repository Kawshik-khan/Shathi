import { NextResponse, type NextRequest } from "next/server";
import {
  resolveProxyVerifyKey,
  verifyHs256Jwt,
} from "@/lib/server/edge-jwt";

const protectedRoutes = [
  "/dashboard",
  "/mood",
  "/habits",
  "/journal",
  "/ai-companion",
  "/insights",
  "/settings",
  "/profile",
  "/sleep",
  "/resources",
  "/subscription",
  "/admin",
];

const SATHI_ACCESS_COOKIE = "sathi_at";
const LEGACY_SATHI_AUTH_COOKIE = "sathi_auth";
const CSP_HEADER = "Content-Security-Policy";
const CSP_NONCE_REQUEST_HEADER = "x-nonce";
const SATHI_API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Headers set by the proxy so the page and downstream BFF routes can
 * observe the verified identity without trusting the cookie value. The
 * backend still re-verifies — these are *hints* for logging, analytics,
 * and SSR.
 */
const X_USER_ID_HEADER = "x-sathi-user-id";
const X_TOKEN_VERSION_HEADER = "x-sathi-token-version";
const X_TOKEN_EXPIRES_HEADER = "x-sathi-token-expires-at";

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Generate a per-request base64-encoded nonce for CSP. ``crypto.subtle``
 * is available on the Edge runtime; 16 bytes of entropy is well above the
 * 128-bit floor recommended by W3C CSP guidance.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is globally available in the Edge runtime.
  return btoa(binary);
}

/**
 * Build the full CSP for this request. ``'strict-dynamic'`` is included
 * in production so any nonced script can load further scripts without
 * needing an ``https:`` allow-list — the nonce is the trust anchor.
 */
function buildCsp(nonce: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isProduction ? [] : ["'unsafe-eval'"]),
    "https://accounts.google.com",
  ];
  const styleSrc = isProduction
    ? ["'self'", `'nonce-${nonce}'`]
    : ["'self'", "'unsafe-inline'", `'nonce-${nonce}'`];
  const connectSrc = ["'self'", SATHI_API_ORIGIN, "https://accounts.google.com"]
    .filter(Boolean);
  const frameSrc = ["'self'", "https://accounts.google.com"];
  const imgSrc = ["'self'", "data:", "blob:", SATHI_API_ORIGIN].filter(Boolean);
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    `img-src ${imgSrc.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function buildLoginRedirect(request: NextRequest, reason: string): NextResponse {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  if (reason !== "no_cookie") {
    // ``expired`` is a soft reason — the user can stay on /login without
    // an error banner. ``invalid`` covers forged / tampered cookies.
    loginUrl.searchParams.set("reason", reason);
  }
  const response = NextResponse.redirect(loginUrl);
  // Always kill the legacy presence-check cookie and any stale access
  // cookie so we don't keep bouncing back to /auth/login with the same
  // stale token.
  response.cookies.set(LEGACY_SATHI_AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(SATHI_ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

async function authenticate(request: NextRequest): Promise<
  | { ok: true; headers: Headers }
  | { ok: false; response: NextResponse }
> {
  const { pathname } = request.nextUrl;
  if (!isProtectedRoute(pathname)) {
    return { ok: true, headers: new Headers(request.headers) };
  }

  const cookieValue = request.cookies.get(SATHI_ACCESS_COOKIE)?.value;
  if (!cookieValue) {
    return { ok: false, response: buildLoginRedirect(request, "no_cookie") };
  }

  let keyMaterial: string;
  try {
    keyMaterial = resolveProxyVerifyKey();
  } catch (error) {
    // Production-without-key: fail closed. Returning a redirect is safer
    // than letting requests through with no verification.
    console.error("[proxy] AUTH_PROXY_VERIFY_KEY missing in production", {
      pathname,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, response: buildLoginRedirect(request, "invalid") };
  }

  const result = await verifyHs256Jwt(cookieValue, keyMaterial);
  if (!result.ok) {
    return {
      ok: false,
      response: buildLoginRedirect(
        request,
        result.reason === "expired" ? "expired" : "invalid",
      ),
    };
  }

  const headers = new Headers(request.headers);
  headers.set(X_USER_ID_HEADER, result.claims.sub);
  headers.set(X_TOKEN_VERSION_HEADER, String(result.claims.tv));
  headers.set(X_TOKEN_EXPIRES_HEADER, String(result.claims.exp));
  return { ok: true, headers };
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();

  const auth = await authenticate(request);
  if (!auth.ok) {
    return auth.response;
  }

  // Forward the nonce downstream so Next.js can attach it to its RSC
  // scripts and inline styles during SSR.
  auth.headers.set(CSP_NONCE_REQUEST_HEADER, nonce);

  const response = NextResponse.next({ request: { headers: auth.headers } });
  response.headers.set(CSP_HEADER, buildCsp(nonce));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes — they don't render HTML and don't need CSP)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * Ignore prefetches so we don't burn CPU on every link hover.
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
