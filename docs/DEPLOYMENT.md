# Deployment

This project deploys as two services:

- Frontend: Next.js app on Vercel from the repository root.
- Backend: FastAPI app on Render from `backend/`.

## Required Checks Before Deploy

Run these from the repository root:

```bash
npm run test:dev
npm run test:prod
```

Use `test:dev` while developing. It runs frontend lint/typecheck and backend compile/tests.

Use `test:prod` before deployment. It runs frontend lint/typecheck/build and backend compile/tests.

`npm run deploy:check` is an alias for the full production check.

## Required Frontend Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public backend origin, for example `https://api.example.com`. |
| `BACKEND_API_URL` | Server-side backend origin for NextAuth callbacks. Use the same Render backend origin as `NEXT_PUBLIC_API_URL`. |
| `AUTH_SECRET` | Required by NextAuth/Auth.js in production. Use a strong random value. |
| `AUTH_URL` | Public frontend origin, for example `https://shathi.vercel.app`. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for sign-in. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret for sign-in. |

## Required Backend Environment

| Variable | Purpose |
|---|---|
| `APP_ENV` | `production` in deployed environments. |
| `DEBUG` | `false` in deployed environments to avoid SQL echo logs. |
| `AUTO_CREATE_TABLES` | `false` in deployed environments; production schema is managed by Alembic. |
| `RUN_MIGRATIONS` | `true` for Docker startup migrations, or `false` if migrations are handled separately. |
| `SECRET_KEY` | Strong JWT signing secret. |
| `DATABASE_URL` or `SUPABASE_DB_URL` | PostgreSQL connection URL. |
| `CORS_ORIGINS` | Comma-separated frontend origins. |
| `GOOGLE_CLIENT_ID` | Same Google OAuth client ID used by Vercel; required to validate Google ID tokens. |
| `HF_API_TOKEN` or `HF_TOKEN` | Hugging Face Router access token for AI responses. |
| `PINECONE_API_KEY` | Pinecone key if memory features are enabled. |
| `PINECONE_INDEX_NAME` | Pinecone index name. |
| `SENTRY_DSN` | Optional backend error monitoring DSN. |

## Frontend Deploy: Vercel

The repository includes `vercel.json` at the root:

```json
{
  "framework": "nextjs",
  "installCommand": "npm ci",
  "buildCommand": "npm run build"
}
```

Vercel project settings:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | repository root |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | leave default |

Required Vercel environment variable:

```env
NEXT_PUBLIC_API_URL=https://shathi.onrender.com
BACKEND_API_URL=https://shathi.onrender.com
AUTH_URL=https://shathi.vercel.app
AUTH_SECRET=<strong-random-secret>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
```

## Backend Docker Environment

Local Docker backend:

```bash
cp backend/.env.example backend/.env
# Fill backend/.env with real Supabase, AI, and CORS values.
docker compose up --build backend
```

Useful backend URLs:

```text
http://localhost:8000/health
http://localhost:8000/docs
```

Container behavior:

- `backend/Dockerfile` builds a Python 3.12 FastAPI image from `backend/requirements.txt`.
- `backend/docker-entrypoint.sh` runs `python -m alembic upgrade head` before app startup when `RUN_MIGRATIONS=true`.
- Set `RUN_MIGRATIONS=false` if you want to start the app without applying migrations.
- The app does not create tables on startup unless `AUTO_CREATE_TABLES=true`.

## Backend Deploy: Render

The repository includes `render.yaml` at the root. It deploys the backend as a Docker web service from `backend/Dockerfile`.

Create a Render Blueprint from the GitHub repo, or create a Web Service manually with these settings:

| Setting | Value |
|---|---|
| Runtime | Docker |
| Root Directory | `backend` |
| Dockerfile Path | `./Dockerfile` |
| Health Check Path | `/health` |

Set the backend environment variables in Render. Do not commit secrets.

Required production values:

```env
APP_ENV=production
DEBUG=false
AUTO_CREATE_TABLES=false
RUN_MIGRATIONS=true
```

After deployment, verify:

```bash
curl https://your-render-backend.onrender.com/
curl https://your-render-backend.onrender.com/health
```

Expected response:

```json
{"status":"healthy","service":"sathi-api"}
```

## Local Production Smoke Test

Frontend:

```bash
npm ci
npm run build
npm run start
```

Backend:

```bash
cd backend
pip install -r requirements-dev.txt
python -m compileall app
python -m pytest -p no:cacheprovider tests
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Health Checks

Use `/health` for Render uptime monitoring. A healthy response is:

```json
{"status":"healthy","service":"sathi-api"}
```

## Production Notes

- Keep the current Sathi UI/theme files unchanged during deployment work.
- Use HTTPS for both services.
- Restrict `CORS_ORIGINS` to known frontend origins.
- Store secrets in the deployment platform secret manager.
- Run CI before deploy: frontend lint, TypeScript, build, and backend tests.
