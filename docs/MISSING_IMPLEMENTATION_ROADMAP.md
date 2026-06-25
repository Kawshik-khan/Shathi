# Missing Implementation Roadmap

Source audit: `docs/PHASE_1_COMPLETION_CHECKLIST.md`

Audit date: 2026-05-18

This file lists what is still missing or only partially implemented, and how to implement each gap. It is ordered by practical launch priority.

## UI Preservation Requirement

All implementation work in this roadmap must keep the current Sathi UI, color palette, and visual style intact.

Do not redesign the app while filling implementation gaps. New forms, dialogs, empty states, loading states, charts, and error states should reuse the existing design language:
- Keep the soft green wellness palette from `src/app/globals.css` and `tailwind.config.cjs`.
- Reuse the existing glassmorphism surfaces: `.glass-card`, `.glass-card-strong`, `GlassCard`, and the current shadow/radius tokens.
- Keep the current dashboard shell, sidebar/header layout, bento grid rhythm, card spacing, rounded controls, and calm wellness tone.
- Use existing UI primitives in `src/components/ui/*` before adding new visual patterns.
- Use `lucide-react` icons consistently with the current pages.
- Preserve light/dark theme behavior and Bengali/English typography support.
- Add only the UI states required to make real features usable: loading, empty, error, validation, disabled, submitting, and success feedback.
- Avoid new color systems, heavy gradients, unrelated illustrations, marketing-style redesigns, or layout rewrites unless a task explicitly requires them.

Acceptance gate for every item:
- The completed feature looks like it belongs in the existing app.
- Existing colors, spacing, typography, cards, navigation, and page structure remain recognizable.
- No implementation should replace working visual components solely for style reasons.

## P0 Launch Blockers

These items block the app from being a usable Phase 1 MVP.

### 1. Replace Mock Dashboard Data With Real API Data

Current gap:
- `src/lib/store.ts` contains mock mood, sleep, goals, habits, journal, and AI insight data.
- Dashboard widgets render local mock state instead of user-specific persisted data.

Implementation approach:
- Add typed frontend API helpers for mood, habits, journal, chat summaries, and user profile.
- Load dashboard data after authentication using the stored bearer token.
- Add loading, empty, and error states to every dashboard widget.
- Keep mock data only as a development fallback if the API is unavailable.
- Preserve the current dashboard bento grid, card sizes, icons, glass styling, and green accent treatment while swapping the data source.

Likely files:
- `src/lib/api.ts`
- `src/lib/store.ts`
- `src/components/widgets/*`
- `src/app/dashboard/page.tsx`

Acceptance criteria:
- After login, dashboard widgets show data from backend APIs.
- Empty accounts show useful empty states, not Amanda/mock data.
- Network/API errors are visible but do not crash the page.
- Dashboard still matches the current Sathi layout and visual style.

### 2. Implement Real Mood Tracking UI

Current gap:
- Backend mood logging and analytics exist.
- `src/app/mood/page.tsx` is mostly static and still says detailed analytics will appear later.
- No real mood selector or persisted mood history UI exists.

Implementation approach:
- Build a mood logging form with mood, stress, energy, sleep, optional note, and submit state.
- Submit to `POST /api/v1/mood/log`.
- Fetch history from `GET /api/v1/mood/logs`.
- Fetch analytics from `GET /api/v1/mood/analytics`.
- Replace placeholder chart with Recharts line/bar views using backend analytics.
- Use the existing calm card layout, green accents, rounded controls, and chart palette; do not introduce a new mood-page visual system.

Likely files:
- `src/app/mood/page.tsx`
- `src/lib/api.ts`
- `src/components/charts/*`
- `backend/app/api/mood/routes.py` only if response shape needs adjustment.

Acceptance criteria:
- User can create a mood log from the UI.
- Mood history persists after reload.
- Analytics charts update after creating a mood log.
- Empty state appears for new users.
- Mood UI keeps the current app colors, cards, spacing, and typography.

### 3. Implement Habit Create/Edit/Delete/Complete UI

Current gap:
- Backend habit routes/services exist.
- Frontend habits page shows mock habit cards and `Add Habit functionality coming soon!`.

Implementation approach:
- Add habit list loading from `GET /api/v1/habits`.
- Add create habit dialog using name, description, icon, color, frequency, and target count.
- Add edit and delete actions per habit.
- Add complete action wired to `POST /api/v1/habits/{habit_id}/complete`.
- Refresh habit cards after create/edit/delete/complete.
- Keep the current habit card visual treatment and extend it with real actions instead of replacing it with a different layout.

Likely files:
- `src/app/habits/page.tsx`
- `src/lib/api.ts`
- `src/components/ui/dialog.tsx`
- `backend/app/api/habits/routes.py` if update schema should be tightened.

Acceptance criteria:
- User can create, edit, delete, and complete habits from the UI.
- Habit streak/progress updates after completion.
- Backend validation errors are shown inline.
- No habit data comes from mock Zustand state.
- Habit create/edit/delete UI uses existing dialogs, buttons, cards, color tokens, and icon styling.

### 4. Implement Journal Editor, History, and Entry Detail

Current gap:
- Backend journal CRUD exists.
- Frontend journal page has only an empty placeholder and a "coming soon" alert.
- No auto-save, editor, history, or persisted journal UI exists.

Implementation approach:
- Add journal list using `GET /api/v1/journal/entries`.
- Add new entry/editor form with title and content.
- Submit new entries to `POST /api/v1/journal/entries`.
- Add edit/delete flows using existing backend routes.
- Implement lightweight auto-save as a local draft first; backend auto-save can come later.
- Use plain textarea for Phase 1 unless rich text is explicitly required for launch.
- Keep the journal screen visually quiet and consistent with existing glass cards, soft shadows, green focus states, and rounded input styling.

Likely files:
- `src/app/journal/page.tsx`
- `src/lib/api.ts`
- `backend/app/api/journal/routes.py`

Acceptance criteria:
- User can create, view, edit, and delete journal entries.
- Entries persist after reload.
- Draft content is not lost on accidental navigation/reload.
- AI/emotion fields returned by backend are displayed when available.
- Journal editor, history, and detail states preserve current app styling.

### 5. Complete Core Auth UX

Current gap:
- Email/password login and registration are wired to custom backend JWT auth.
- Google/Apple OAuth buttons are visual only.
- Forgot password shows a "coming soon" alert.
- Registration has no terms checkbox or email verification.
- No Next.js middleware route protection exists.

Implementation approach:
- For Phase 1, keep custom backend JWT auth to avoid a midstream Supabase Auth migration.
- Add terms checkbox to signup and block submit until accepted.
- Replace unwired OAuth buttons with disabled "Coming soon" state or implement provider-specific OAuth fully.
- Add backend forgot-password endpoints only if email delivery is configured; otherwise remove the CTA from MVP.
- Add a Next.js `middleware.ts` route guard if auth token can be read reliably on the server; otherwise document client-only protection as a known limitation.
- Keep the existing auth layout, brand treatment, input styling, and button colors; changes should only make auth behavior honest and complete.

Likely files:
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/middleware.ts`
- `backend/app/api/auth/routes.py`
- `backend/app/services/auth.py`

Acceptance criteria:
- No visual auth action is fake or silently nonfunctional.
- Signup requires terms acceptance.
- Auth state survives refresh.
- Protected pages redirect unauthenticated users.
- Auth screens retain the current visual design.

### 6. Add Automated Test Baseline

Current gap:
- No frontend tests found.
- No backend test files found, despite pytest dependencies.
- No route/database/error handling tests.

Implementation approach:
- Add backend pytest tests for auth, mood, habits, journal, and chat route import/smoke behavior.
- Use a test database URL or SQLite-compatible test config.
- Add frontend component or integration tests for auth forms and core pages.
- Add a CI command that runs lint, TypeScript, build, and backend tests.
- Include visual-state coverage where practical for existing components so implementation work does not regress loading, empty, error, and disabled states.

Likely files:
- `backend/tests/*`
- `package.json`
- `.github/workflows/ci.yml`
- Optional frontend test config if a runner is selected.

Acceptance criteria:
- Backend tests can run locally with one documented command.
- CI runs lint, TypeScript, build, and backend tests.
- At least auth, mood, habits, and journal happy paths have test coverage.
- Tests do not require or encourage UI rewrites outside the current design system.

### 7. Add Deployment and Environment Baseline

Current gap:
- Docker backend config exists.
- No Vercel, Railway, Render, or CI/CD config found.
- Production DB, HTTPS, domain, and environment separation are unverified.

Implementation approach:
- Add deployment docs listing required frontend and backend environment variables.
- Add `vercel.json` only if custom frontend config is needed.
- Add Render/Railway config or document manual backend deployment steps.
- Add health check verification for `/health`.
- Confirm production `DATABASE_URL`, CORS origins, JWT secret, and model API credentials.
- Document that deployment work must not change frontend styling, theme tokens, or route structure unless technically required.

Likely files:
- `docs/DEPLOYMENT.md`
- `.github/workflows/ci.yml`
- `backend/Dockerfile`
- `docker-compose.yml`

Acceptance criteria:
- A new engineer can deploy frontend and backend from docs.
- Production env var checklist is complete.
- Backend health endpoint is reachable after deployment.

## P1 MVP Completeness

These items make the MVP feel complete and safer, but can follow the core workflow wiring.

### 8. Add Streaming Chat

Current gap:
- Backend has `generate_streaming_response`.
- Chat route and frontend use non-streaming responses.

Implementation approach:
- Add a streaming chat endpoint, preferably `POST /api/v1/chat/stream`.
- Return SSE chunks from backend.
- Update frontend chat UI to append assistant tokens as they arrive.
- Keep non-streaming `/chat/send` as fallback.
- Preserve the current AI companion screen and message styling; streaming should feel like the same UI becoming more responsive.

Likely files:
- `backend/app/api/chat/routes.py`
- `backend/app/services/chat.py`
- `backend/app/services/ai.py`
- `src/app/ai-companion/page.tsx`

Acceptance criteria:
- Assistant response appears progressively.
- Conversation and final assistant message are still persisted.
- Network interruption shows a retryable error state.
- Chat UI retains current colors, cards, spacing, and tone.

### 9. Wire Explicit Crisis Detection Into Chat

Current gap:
- Crisis service and crisis resources exist.
- Chat flow mostly flags crisis from emotion detection.

Implementation approach:
- Call `detect_crisis(message_content)` before normal AI generation.
- If crisis is detected, persist the user message and return the safe crisis response/resources.
- Add UI treatment for crisis response with emergency resources.
- Add tests for self-harm and crisis phrases.
- Add crisis UI as a restrained existing-style alert/card, using current destructive/support tokens instead of a separate visual language.

Likely files:
- `backend/app/services/chat.py`
- `backend/app/services/crisis.py`
- `backend/app/api/crisis/routes.py`
- `src/app/ai-companion/page.tsx`
- `src/app/resources/page.tsx`

Acceptance criteria:
- Crisis phrases trigger a safe response.
- Crisis messages are stored with `crisis_flag`.
- Emergency resources are visible in the chat response.
- Crisis resources are visually clear while still matching the app style.

### 10. Add Basic Unsafe Response Filtering

Current gap:
- Safety behavior is mostly prompt and fallback text.
- No explicit filter/review layer found.

Implementation approach:
- Add pre-response and post-response safety checks for obvious self-harm, medical, coercive, or unsafe content.
- For Phase 1, use rule-based checks plus AI prompt constraints.
- Log safety interventions without storing sensitive text in logs.
- Surface safety fallbacks through the existing chat/error UI patterns.

Likely files:
- `backend/app/services/ai.py`
- `backend/app/services/crisis.py`
- `backend/app/services/chat.py`

Acceptance criteria:
- Unsafe assistant output is replaced with a safe support response.
- Safety intervention path is covered by tests.

### 11. Persist Settings

Current gap:
- Settings widgets update local Zustand store.
- Profile, notification, wellness, privacy, memory, and AI personality settings are not fully persisted.

Implementation approach:
- Add or extend backend user/settings schema.
- Add `GET /api/v1/users/me/settings` and `PUT /api/v1/users/me/settings`, or fold settings into the user profile endpoint.
- Load settings on settings page mount.
- Save each widget to backend on submit.
- Keep the current settings sidebar, widget cards, segmented controls, toggles, and form density.

Likely files:
- `backend/app/models/user.py`
- `backend/app/schemas/user.py`
- `backend/app/api/user/routes.py`
- `src/lib/stores/settingsStore.ts`
- `src/components/settings/widgets/*`

Acceptance criteria:
- Settings persist after reload and across sessions.
- Form validation errors display inline.
- Local store reflects backend state after save.
- Settings page remains visually consistent with existing widgets.

### 12. Complete Privacy and Account Controls

Current gap:
- Data export uses an alert.
- Delete account is missing.
- Session management is a TODO alert.
- Password update is missing.

Implementation approach:
- Add backend endpoints for password update, data export, account deletion, and active sessions as supported by current auth model.
- For export, generate JSON containing profile, mood logs, habits, journal entries, and conversations.
- For delete account, soft-delete first if product policy requires retention; otherwise delete user-owned rows.
- Add account/privacy states inside the current settings widgets; use existing button variants and confirmation dialogs.

Likely files:
- `backend/app/api/user/routes.py`
- `backend/app/services/user.py`
- `src/components/settings/widgets/PrivacyWidget.tsx`
- `src/components/settings/widgets/SecurityWidget.tsx`

Acceptance criteria:
- Export downloads a valid JSON file.
- Password update requires current password.
- Delete account requires confirmation.
- Session management no longer shows placeholder alert.
- Privacy and security controls keep the current settings UI style.

### 13. Improve Insights Data Wiring

Current gap:
- Insights UI exists but appears static/mock.
- Recharts sizing warnings appear during build.

Implementation approach:
- Fetch real mood, habit, journal, and chat analytics.
- Replace static recommendation copy with backend-derived summaries where possible.
- Fix chart containers with stable dimensions and min sizes.
- Keep the current insights header, grid structure, glass panels, green chart palette, and soft visualization style.

Likely files:
- `src/app/insights/*`
- `src/components/insights/*`
- `src/components/charts/*`
- `backend/app/services/mood.py`
- `backend/app/services/habit.py`
- `backend/app/services/journal.py`

Acceptance criteria:
- Insights change when user data changes.
- Build no longer emits Recharts width/height warnings.
- Empty-state insights are useful for new users.
- Insights screen remains visually aligned with the existing dashboard.

### 14. Add Rate Limiting and Error Middleware

Current gap:
- No rate limiting.
- No dedicated global error handling middleware.

Implementation approach:
- Add FastAPI rate limiting for auth and chat endpoints first.
- Add global exception handlers for validation, HTTP, and unexpected errors.
- Ensure errors return consistent JSON shape.
- Map standardized backend errors into the app's existing inline error, toast/dialog, and card-level error patterns.

Likely files:
- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/core/errors.py`

Acceptance criteria:
- Excess auth/chat requests receive `429`.
- Unexpected backend errors return a generic message and are logged.
- Frontend displays useful error messages from the standard error shape.

## P2 Polish and Launch Readiness

### 15. Complete Landing Page Polish

Current gap:
- Hero 3D illustration is a placeholder.
- Landing bento grid lacks several intended feature cards.
- Footer/social links are placeholders.

Implementation approach:
- Replace placeholder hero asset with a real generated image, 3D scene, or polished app visual.
- Add goals, habits, journal, AI insight, and emotional check-in feature cards.
- Wire CTA and footer links to real routes/sections.
- Polish within the current landing style only: keep the Sathi palette, typography, soft green accents, glass surfaces, and existing section rhythm.

Likely files:
- `src/components/landing/hero-section.tsx`
- `src/components/landing/feature-grid.tsx`
- `src/components/landing/footer.tsx`

Acceptance criteria:
- No placeholder text remains on landing page.
- Primary CTA navigates to signup/login.
- Feature grid represents actual MVP capabilities.
- Landing polish does not change the established brand style or color palette.

### 16. Accessibility and Responsive QA

Current gap:
- Some aria labels exist, but no full accessibility or viewport QA evidence.
- Reduced motion support is missing.

Implementation approach:
- Add keyboard navigation pass for landing, auth, dashboard, chat, mood, habits, journal, insights, and settings.
- Add visible focus styles for interactive controls.
- Add `prefers-reduced-motion` handling for major animations.
- Capture desktop/mobile screenshots for visual overlap checks.
- Accessibility fixes should enhance the existing UI states and focus rings without changing the visual identity.

Likely files:
- `src/app/globals.css`
- Shared buttons/dialogs/forms
- Page-level components with custom controls

Acceptance criteria:
- All main flows work by keyboard.
- Focus states are visible.
- Reduced motion users do not get large continuous animations.
- No text overlap on common mobile/tablet/desktop viewports.
- Responsive and accessibility fixes preserve current layouts unless a layout is objectively broken.

### 17. Performance Baseline

Current gap:
- No Lighthouse score evidence.
- No bundle or API latency audit found.

Implementation approach:
- Run Lighthouse on landing and dashboard.
- Inspect Next build output and reduce unnecessary client components if needed.
- Add API timing logs for slow routes.
- Optimize images/assets after landing visual assets are finalized.
- Performance changes should preserve rendered UI; optimize implementation details before changing appearance.

Likely files:
- `docs/PERFORMANCE_BASELINE.md`
- `src/app/*`
- `backend/app/core/logging.py`

Acceptance criteria:
- Lighthouse result is documented.
- Performance regressions have a repeatable check.
- No obviously oversized unused frontend dependency remains.

### 18. Monitoring and Production Readiness

Current gap:
- No monitoring setup evidence.
- Background workers are missing.
- Production stability is unverified.

Implementation approach:
- Add Sentry or equivalent for backend errors if product policy allows.
- Add frontend error reporting if needed.
- Add uptime/health monitoring around `/health`.
- Add background workers only when a concrete async job exists, such as email, export generation, or scheduled reminders.
- Monitoring additions should be invisible to users except for improved existing-style error handling.

Likely files:
- `backend/app/main.py`
- `backend/app/core/config.py`
- `docs/DEPLOYMENT.md`

Acceptance criteria:
- Production errors are visible to maintainers.
- Health checks are documented.
- Background jobs are not introduced until needed by a real feature.

## Recommended Implementation Order

1. Keep custom JWT auth for Phase 1 and remove/disable fake OAuth buttons, or fully implement OAuth as a separate auth project.
2. Wire real API data into dashboard, mood, habits, and journal.
3. Add backend/frontend tests for auth, mood, habits, journal, and chat.
4. Add crisis detection into chat and standardize backend errors.
5. Add deployment docs and CI.
6. Polish landing page, accessibility, and performance.

Throughout this order, preserve the existing UI, color palette, and style. Treat visual changes as bug fixes only when current UI states are missing, broken, inaccessible, or inconsistent.

## Definition of Done for Phase 1 MVP

- A user can register, log in, and access protected pages.
- A user can create and view persisted mood logs, habits, journal entries, and chat conversations.
- Dashboard and insights use real user data or honest empty states.
- No primary UI button says "coming soon" for a Phase 1 feature.
- The app still uses the same Sathi glassmorphism UI, soft green palette, layout system, typography, and component style after implementation.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, and backend tests pass.
- Deployment instructions and required environment variables are documented.
