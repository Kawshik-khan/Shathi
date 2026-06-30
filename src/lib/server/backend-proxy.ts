/**
 * P1 1.3 — backend proxy.
 *
 * Browser → BFF (``/api/backend/proxy/[...path]``) → FastAPI.
 *
 * The browser always sends ``credentials: 'include'`` on calls to the
 * proxy so the ``sathi_at`` HttpOnly cookie rides along. The BFF then
 * reads the cookie from the incoming request, attaches it as a Bearer
 * Authorization header on the server-side fetch to FastAPI, and
 * forwards the response back to the browser verbatim.
 *
 * Why the indirection:
 *  - ``sathi_at`` is HttpOnly + SameSite=Lax → the browser cannot read
 *    it from JS, so we can't put it into a fetch's Authorization header
 *    directly. The BFF reads it server-side and adds the header.
 *  - It also means we don't need ``allow_credentials=True`` /
 *    ``Access-Control-Allow-Credentials: true`` on FastAPI's CORS — the
 *    browser-to-BFF leg is same-origin, and the BFF-to-FastAPI leg is
 *    server-to-server (no CORS at all).
 *
 * Request/response are forwarded as-is, with the exception of the auth
 * header (injected from the cookie) and a few request headers that
 * should not leak from the browser to the backend (``cookie``,
 * ``host``, ``connection``).
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  SATHI_ACCESS_COOKIE,
} from "@/lib/server/auth-cookies";

const BACKEND_TIMEOUT_MS = 30_000;

function getBackendOrigin(): string {
  const configured = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const fallback = process.env.NODE_ENV === "production" ? "" : "http://localhost:8000";
  const raw = (configured || fallback).replace(/\/$/, "");
  if (!raw || !/^https?:\/\//.test(raw)) {
    throw new Error("BACKEND_API_URL must be an absolute URL for backend-proxy.");
  }
  return raw;
}

/**
 * Read a single cookie value from a ``Cookie:`` header. Same approach
 * used in the refresh route — kept private to this file rather than
 * exported, because no other BFF route should be reading cookies.
 */
function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const segment of cookieHeader.split(";")) {
    const trimmed = segment.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return null;
}

/** Headers we never want forwarded from the browser hop. */
const DROP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "cookie",
  "transfer-encoding",
  "content-length",
]);

/** Headers we never want echoed back from the backend. */
const DROP_RESPONSE_HEADERS = new Set([
  "set-cookie", // backend would issue a fresh one; we manage cookies here
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
]);

async function forward(request: NextRequest, targetPath: string[]): Promise<Response> {
  const origin = getBackendOrigin();
  // ``request.nextUrl.pathname`` is ``/api/backend/proxy/...``; strip the
  // ``/api/backend/proxy`` prefix to get the real backend path.
  const backendPath = "/" + targetPath.join("/");
  const url = new URL(backendPath + request.nextUrl.search, origin);

  // Pull the access token from the cookie the browser already sent.
  const cookieHeader = request.headers.get("cookie");
  const accessToken = readCookie(cookieHeader, SATHI_ACCESS_COOKIE);

  const inboundHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (DROP_REQUEST_HEADERS.has(key.toLowerCase())) return;
    inboundHeaders.set(key, value);
  });
  if (accessToken) {
    inboundHeaders.set("Authorization", `Bearer ${accessToken}`);
  }
  // The browser-origin ``Origin`` / ``Referer`` shouldn't be forwarded.
  inboundHeaders.delete("origin");
  inboundHeaders.delete("referer");

  // Forward the body. ``request.body`` is a ReadableStream; FastAPI
  // accepts it because ``fetch`` already handles the streaming.
  const init: RequestInit = {
    method: request.method,
    headers: inboundHeaders,
    // ``cache: 'no-store'`` is implicit because we don't set the
    // Next.js fetch cache directives here, but be explicit anyway:
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    // Node 18+ requires ``duplex`` when streaming a request body.
    (init as RequestInit & { duplex?: "half" }).duplex = "half";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const upstream = await fetch(url, { ...init, signal: controller.signal });
    const outboundHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (DROP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
      outboundHeaders.set(key, value);
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outboundHeaders,
    });
  } catch (error) {
    const isAbort =
      error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json(
      {
        detail: isAbort
          ? `Upstream timed out after ${BACKEND_TIMEOUT_MS}ms`
          : "Upstream error",
      },
      { status: isAbort ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Catch-all proxy. Handles every method so we don't have to register
 * a route file per verb.
 */
async function handle(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(request, path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;