# Performance Baseline

Baseline date: 2026-05-18

## Current Checks

| Check | Command | Status |
|---|---|---|
| TypeScript | `cmd /c npm exec -- tsc --noEmit` | Required before deploy |
| Lint | `cmd /c npm run lint` | Required before deploy |
| Production build | `cmd /c npm run build` | Required before deploy |
| Backend import/test smoke | `python -m compileall backend/app` and backend tests | Required before deploy |

## Lighthouse Targets

Run Lighthouse against:

- `/landing`
- `/dashboard`
- `/mood`
- `/ai-companion`

Target scores:

| Category | Target |
|---|---|
| Performance | 85+ |
| Accessibility | 90+ |
| Best Practices | 90+ |
| SEO | 85+ for public pages |

## Follow-Up Measurements

- Record bundle size from `next build`.
- Capture API latency for auth, mood, habits, journal, and chat endpoints.
- Re-check Recharts containers after chart changes so width/height warnings do not return.

## Notes

- Preserve existing UI, color, and style during performance work.
- Prefer reducing unnecessary client code before changing visuals.
