import type { TokenResponse } from "@/types";

const BACKEND_AUTH_TIMEOUT_MS = 8_000;

type GoogleCallbackPayload = {
  googleToken: string;
  profile?: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
};

export class BackendAuthError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "BackendAuthError";
    this.status = status;
    this.detail = detail || message;
  }
}

function getBackendApiBaseUrl(): string {
  const configuredUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const fallbackUrl = process.env.NODE_ENV === "production" ? "" : "http://localhost:8000";
  const rawUrl = (configuredUrl || fallbackUrl).replace(/\/$/, "");

  if (!rawUrl || !/^https?:\/\//.test(rawUrl)) {
    throw new Error("BACKEND_API_URL must be an absolute URL for server-side auth callbacks.");
  }

  return rawUrl;
}

function resolveBackendUrl(path: string): string {
  const baseUrl = getBackendApiBaseUrl();
  const baseHasVersionedPrefix = /\/api\/v\d+$/.test(baseUrl);
  const pathHasVersionedPrefix = /^\/api\/v\d+(?:\/|$)/.test(path);

  if (pathHasVersionedPrefix) {
    return baseHasVersionedPrefix
      ? `${baseUrl.replace(/\/api\/v\d+$/, "")}${path}`
      : `${baseUrl}${path}`;
  }

  if (path.startsWith("/api/")) {
    return baseHasVersionedPrefix
      ? `${baseUrl}${path.slice("/api".length)}`
      : `${baseUrl}/api/v1${path.slice("/api".length)}`;
  }

  return `${baseUrl}${path}`;
}

function backendHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-backend-url";
  }
}

export async function fetchBackendAuth<T>(
  path: string,
  payload: unknown,
  label: string,
): Promise<T> {
  const url = resolveBackendUrl(path);
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      let detail = `${label} failed with status ${response.status}`;
      try {
        const payload = await response.json();
        detail = payload.detail || payload.message || detail;
      } catch {
        // Keep the status-based detail when the backend response is not JSON.
      }
      console.error("[auth] backend exchange failed", {
        label,
        host: backendHost(url),
        status: response.status,
        elapsedMs: Date.now() - startedAt,
      });
      throw new BackendAuthError(`${label} failed with status ${response.status}`, response.status, detail);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof BackendAuthError) {
      throw error;
    }

    const isAbort = error instanceof DOMException && error.name === "AbortError";
    console.error("[auth] backend exchange error", {
      label,
      host: backendHost(url),
      timeoutMs: BACKEND_AUTH_TIMEOUT_MS,
      elapsedMs: Date.now() - startedAt,
      error: isAbort ? "timeout" : error instanceof Error ? error.message : "unknown",
    });
    throw new Error(
      isAbort
        ? `${label} timed out after ${BACKEND_AUTH_TIMEOUT_MS}ms`
        : `${label} failed`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function exchangeGoogleTokenForBackendTokens(
  payload: GoogleCallbackPayload,
): Promise<TokenResponse> {
  return fetchBackendAuth<TokenResponse>(
    "/api/v1/auth/google-callback",
    payload,
    "Google backend token exchange",
  );
}

/**
 * P1 1.3: after a successful Google exchange, the FastAPI tokens have to
 * be persisted as HttpOnly cookies on the user's browser. Because the
 * Auth.js ``jwt`` callback runs server-side, we can hit our own BFF
 * endpoint which sets ``sathi_at`` / ``sathi_rt`` via Set-Cookie. The
 * response cookies are NOT propagated by Auth.js to the browser; only
 * their HTTP request is what matters, since ``/api/backend-auth/google``
 * is a same-origin POST issued from the server.
 *
 * If the request cannot reach the BFF, we log a warning but do not throw
 * — the tokens are still valid in memory and the user can resume sign-in
 * through the credentials flow which DOES set the cookies.
 */
export async function persistBackendTokensAsCookies(
  origin: string,
  tokens: TokenResponse,
): Promise<void> {
  if (!origin) return;
  try {
    await fetch(`${origin.replace(/\/$/, "")}/api/backend-auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.warn("[auth] failed to persist backend tokens as cookies", {
      origin,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
