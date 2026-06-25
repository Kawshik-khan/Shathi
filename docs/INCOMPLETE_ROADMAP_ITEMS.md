# Incomplete Roadmap Items

This file tracks the parts of `MISSING_IMPLEMENTATION_ROADMAP.md` that are not fully completed yet, plus items completed after this tracker was created.

## Completed In Current Implementation Pass

| Area | Files | Completion Notes |
|---|---|---|
| Settings persistence | `src/lib/stores/settingsStore.ts`, `src/components/settings/SettingsGrid.tsx`, `backend/app/models/settings.py`, `backend/app/schemas/user.py`, `backend/app/api/user/routes.py`, `backend/app/services/user.py`, `backend/alembic/versions/003_user_settings.py` | Added persisted `user_settings` table, GET/PUT settings endpoints, frontend load/save behavior, and save controls on settings widgets. |
| Privacy/account controls | `src/components/settings/widgets/PrivacyWidget.tsx`, `src/components/settings/widgets/SecurityWidget.tsx`, `backend/app/api/user/routes.py`, `backend/app/services/user.py` | Added data export download, password update, current session metadata, and soft account deletion. |
| Streaming chat UI | `src/app/ai-companion/page.tsx`, `src/lib/api.ts`, `backend/app/api/chat/routes.py`, `backend/app/services/chat.py` | Added `/api/v1/chat/stream` SSE route and token-by-token frontend rendering with final message persistence. |
| CI/deployment docs | `docs/DEPLOYMENT.md`, `.github/workflows/ci.yml`, `docs/MONITORING.md`, `docs/PERFORMANCE_BASELINE.md` | Added deployment checklist, CI workflow, monitoring notes, and performance baseline document. |
| Rate limiting/error middleware | `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/core/errors.py` | Added standard error response handlers and process-local auth/chat rate limiting. |
| Monitoring/production readiness | `backend/app/main.py`, `backend/app/core/config.py`, `docs/MONITORING.md` | Added optional `SENTRY_DSN` initialization and health monitoring guidance. |

## Remaining Core Items

| Area | Files | Why Not Fully Completed |
|---|---|---|
| Full test suite | `backend/tests/*`, frontend test config if added later, `package.json` | Focused backend tests now cover crisis safety, settings defaults, and error response shape. Full route/database tests for auth, mood, habits, journal, chat, and frontend UI tests are still missing. |

## Partially Related Remaining Items

| Area | Files | Why Not Fully Completed |
|---|---|---|
| Insights real data wiring | `src/app/insights/*`, `src/components/insights/*`, `src/components/charts/*`, backend analytics services | Dashboard mood, habits, and journal widgets are wired to real APIs, but Insights still appears partly static/mock. |
| Landing polish | `src/components/landing/*` | Placeholder/marketing polish has not been addressed yet. |
| Accessibility/responsive QA | `src/app/globals.css`, shared UI/components/pages | No full keyboard, reduced-motion, or screenshot QA pass has been completed. |
| Performance baseline | `docs/PERFORMANCE_BASELINE.md`, `src/app/*` | The build passes, but no Lighthouse, bundle, or API latency baseline document has been created. |

## Notes

- Preserve the existing Sathi UI, color palette, typography, glass cards, and layout system while completing these items.
- Prefer extending current components and patterns over introducing new visual systems.
- Keep future implementation scoped to the listed areas unless the roadmap is updated.
