import type { NextConfig } from "next";

/**
 * Production hardening.
 *
 * - `poweredByHeader: false` removes the `X-Powered-By: Next.js` fingerprint.
 * - `compress: true` enables Next's built-in gzip/brotli for static assets
 *   (the API is on FastAPI/GZipMiddleware).
 * - `async headers()` sets a baseline HSTS, frame-deny, referrer and
 *   permissions policy for every route. The Content-Security-Policy is
 *   generated per-request inside ``src/proxy.ts`` because the nonce must
 *   be unique for every page render.
 * - `experimental.serverActions.allowedOrigins` pins server actions to
 *   the public origin so a stale proxy header can't be used to redirect
 *   them. The `experimental` nesting is intentional in this Next.js
 *   version — `serverActions` has not been promoted to a top-level key
 *   here yet.
 */
const baseSecurityHeaders = [
  // Belt-and-braces: even though we don't render user HTML in iframes,
  // deny framing outright.
  { key: "X-Frame-Options", value: "DENY" },
  // Disable MIME sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer leakage.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict powerful APIs by default.
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  // HSTS only matters over HTTPS; safe to ship on every response.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

// CSP is constructed per-request inside ``src/proxy.ts`` because the
// nonce must be unique for every page render. ``next.config.ts`` only
// ships the static security headers (HSTS, frame-deny, etc.) so that
// assets which bypass the proxy (e.g. ``_next/static``) still inherit
// a sensible baseline.
//
// If you need to add a new directive, do it in the proxy — there is no
// build-time CSP here.

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  generateEtags: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: baseSecurityHeaders,
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: process.env.AUTH_URL
        ? [process.env.AUTH_URL]
        : undefined,
    },
  },
};

export default nextConfig;

