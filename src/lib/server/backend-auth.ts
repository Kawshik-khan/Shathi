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

async function fetchBackendAuth<T>(
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
      console.error("[auth] backend exchange failed", {
        label,
        host: backendHost(url),
        status: response.status,
        elapsedMs: Date.now() - startedAt,
      });
      throw new Error(`${label} failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
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
