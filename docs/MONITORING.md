# Monitoring

## Backend Errors

The backend reads `SENTRY_DSN`. When set, `backend/app/main.py` initializes Sentry for FastAPI error reporting.

Recommended production variables:

```env
APP_ENV=production
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

## Uptime

Monitor:

```text
GET /health
```

Expected response:

```json
{"status":"healthy","service":"sathi-api"}
```

## Rate Limits

Process-local rate limits protect:

- `/api/v1/auth/*`
- `/api/v1/chat/*`

Tune with:

```env
RATE_LIMIT_WINDOW_SECONDS=60
AUTH_RATE_LIMIT_MAX=20
CHAT_RATE_LIMIT_MAX=60
```

## Operational Notes

- Use platform-level rate limiting in production when multiple backend replicas are running.
- Keep health checks free of database or third-party API dependencies.
- Do not log sensitive user journal, mood, or chat text in monitoring tools.
