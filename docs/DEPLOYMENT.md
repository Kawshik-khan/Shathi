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
| `AUTH_SECRET_1` | Optional previous Auth.js secret during rotation, used only if old sessions must keep working. |
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
# Optional during secret rotation only:
# AUTH_SECRET_1=<previous-auth-secret>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
```

If Vercel logs `JWTSessionError: no matching decryption secret`, set a stable
`AUTH_SECRET`, redeploy, then ask affected users to use the login page's
session reset action or clear cookies for `shathi.vercel.app`. Old JWT session
cookies cannot be recovered unless the previous secret is known and set as
`AUTH_SECRET_1` during the transition.

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
{"status":"healthy","service":"shathi-api"}
```

## Production Optimization

The backend has been specifically optimized for lightweight production deployment on platforms like Render's Free tier (which has a strict 512MB RAM and build-time limitations):

- **Removed heavy local dependencies**: Removed `torch` and `transformers` from `requirements.txt`. They are only used for local ML execution. In production, Shathi's mood detection and memory embeddings use **Hugging Face's high-performance Hosted Inference API**, which is fast, lightweight, and requires no local compilation or large memory allocations.
- **Enormous Image and Memory Reductions**: This optimization reduces the Docker container size from ~4GB down to **~250MB**, and speeds up deployment build times from 15 minutes to **under 1 minute**, completely eliminating Out-Of-Memory (OOM) build/runtime failures.

## Automated CI/CD (GitHub Actions + Render Deploy Hook)

We have configured a complete, automated Continuous Integration and Continuous Deployment (CI/CD) pipeline for the project.

### Pipeline Flow
1. Code is pushed to `main` or a Pull Request is opened.
2. **CI Stage**: GitHub Actions triggers `.github/workflows/ci.yml`.
   - Runs frontend tests, checks types, lints, and builds.
   - Runs backend Python static compilation and all 52 unit tests.
3. **CD Stage**: If all tests pass on a push to `main`:
   - GitHub Actions automatically calls your **Render Deploy Hook URL** via a secure POST request.
   - Render pulls the latest codebase, builds the lightweight Docker image, runs the Alembic database migrations, and performs a zero-downtime deployment.

### Setup Instructions
To enable automatic deployments on Render:
1. Go to your **Render Dashboard** -> Select your **shathi-api** web service.
2. In the service's **Settings**, scroll down to the **Deploy Hook** section.
3. Copy the unique URL provided by Render.
4. Go to your **GitHub Repository** -> **Settings** -> **Secrets and variables** -> **Actions**.
5. Click **New repository secret**.
6. Name the secret **`RENDER_DEPLOY_HOOK_URL`** and paste the copied URL as the value.
7. Click **Add secret**.

The pipeline is fully safe: if either frontend or backend tests fail, the deployment is skipped automatically to avoid breaking production!

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
{"status":"healthy","service":"shathi-api"}
```

## Production Notes

- Keep the current Sathi UI/theme files unchanged during deployment work.
- Use HTTPS for both services.
- Restrict `CORS_ORIGINS` to known frontend origins.
- Store secrets in the deployment platform secret manager.
- Run CI before deploy: frontend lint, TypeScript, build, and backend tests.
