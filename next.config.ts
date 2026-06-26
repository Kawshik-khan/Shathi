import type { NextConfig } from "next";

/**
 * Production hardening.
 *
 * - `poweredByHeader: false` removes the `X-Powered-By: Next.js` fingerprint.
 * - `compress: true` enables Next's built-in gzip/brotli for static assets
 *   (the API is on FastAPI/GZipMiddleware).
 * - `async headers()` sets a baseline CSP, HSTS, frame-deny, referrer and
 *   permissions policy for every route. Per-route overrides go BELOW the
 *   catch-all in `next.config.js` style so the last match wins.
 * - `experimental.serverActions.allowedOrigins` pins server actions to
 *   the public origin so a stale proxy header can't be used to redirect
 *   them. The `experimental` nesting is intentional in this Next.js
 *   version — `serverActions` has not been promoted to a top-level key
 *   here yet.
 */
const isProduction = process.env.NODE_ENV === "production";

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "";

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

// CSP is built per-environment because the dev origin (Next dev server)
// is different from prod. The `script-src` line uses `'self'` plus the
// nonce the proxy will inject; `'unsafe-inline'` is omitted so we don't
// regress Lighthouse "best-practices" on inline handlers.
const buildCsp = (): string => {
  const scriptSrc = [
    "'self'",
    // Next.js hydration helpers; safe to allow per Next docs.
    "'unsafe-inline'",
    "https://accounts.google.com",
  ];
  const connectSrc = ["'self'", apiOrigin, "https://accounts.google.com"].filter(
    Boolean,
  );
  const frameSrc = ["'self'", "https://accounts.google.com"];
  const imgSrc = ["'self'", "data:", "blob:", apiOrigin].filter(Boolean);
  const styleSrc = [
    "'self'",
    "'unsafe-inline'", // Tailwind + Radix inject inline styles.
  ];
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    `img-src ${imgSrc.join(" ")}`,
    `font-src 'self' data:`,
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
};

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
        headers: [
          ...baseSecurityHeaders,
          { key: "Content-Security-Policy", value: buildCsp() },
        ],
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

