export interface ApiError extends Error {
  status?: number;
  code?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function resolveApiUrl(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const baseHasVersionedPrefix = /\/api\/v\d+$/.test(baseUrl);
  const urlHasVersionedPrefix = /^\/api\/v\d+(?:\/|$)/.test(url);

  if (urlHasVersionedPrefix) {
    return baseHasVersionedPrefix
      ? `${baseUrl.replace(/\/api\/v\d+$/, '')}${url}`
      : `${baseUrl}${url}`;
  }

  if (url.startsWith('/api/')) {
    return baseHasVersionedPrefix
      ? `${baseUrl}${url.slice('/api'.length)}`
      : `${baseUrl}/api/v1${url.slice('/api'.length)}`;
  }

  return `${baseUrl}${url}`;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<T> {
  const fullUrl = resolveApiUrl(url);
  
  // Get token from localStorage if available (populated after successful login)
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        token = parsed.accessToken || parsed.access_token;
      } catch {
        // Ignore parse errors
      }
    }
  }

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (response.ok) {
        try {
          return await response.json();
        } catch {
          throw new Error('Invalid response format from server');
        }
      }

      // For client errors (4xx), don't retry
      if (response.status >= 400 && response.status < 500) {
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // Ignore parse errors for error responses
        }

        const error: ApiError = new Error(errorMessage);
        error.status = response.status;
        error.code = response.status === 401 ? 'UNAUTHORIZED' :
                     response.status === 403 ? 'FORBIDDEN' :
                     response.status === 404 ? 'NOT_FOUND' : 'CLIENT_ERROR';
        throw error;
      }

      // For server errors (5xx), retry
      if (response.status >= 500) {
        const error: ApiError = new Error('Server error');
        error.status = response.status;
        error.code = 'SERVER_ERROR';
        if (attempt === maxRetries) throw error;
        lastError = error;
      }

    } catch (error) {
      if (error instanceof Error && (error as ApiError).status) {
        // Already handled client error
        throw error;
      }

      // Network error or other fetch error
      lastError = error instanceof Error ? error : new Error('Network error');

      if (attempt === maxRetries) {
        const apiError: ApiError = new Error('Network error - please check your connection');
        apiError.code = 'NETWORK_ERROR';
        throw apiError;
      }
    }

    // Exponential backoff for retries
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function login(email: string, password: string) {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name: string) {
  return apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getProfile() {
  return apiFetch('/api/v1/users/me');
}


