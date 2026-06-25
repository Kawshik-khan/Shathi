---
sessionId: session-260625-124316-18q9
---

# Requirements

### Overview & Goals
Turn the existing **Sathi** Next.js 16 / React 19 wellness web app into a polished, production-ready **Android mobile app branded "Shathi"**. The work has three pillars:

1. **Rebrand to "Shathi"** across the launcher name, splash, window title, and user-facing app name.
2. **Custom visual identity** — a generated SVG **app icon** and a set of **glassmorphism/bento-styled illustrations** for key screens and empty states.
3. **Optimized bento-grid + glassmorphism UI** refinements and a **production signed APK** output.

This builds directly on the prior effort (`.junie/plans/bento-glass-daytime-android.md`) which established the bento/glass design system, the daytime gradient engine, and the Capacitor Android wrapper that already produces an unsigned `app-release-unsigned.apk`.

### Scope
**In Scope**
- Rename the user-facing app/brand to **Shathi**: `siteConfig.name`, i18n strings (`en.json`/`bn.json`), Android `strings.xml` (`app_name`, `title_activity_main`), `capacitor.config.ts` `appName`, and document `<title>`/metadata.
- Generate a custom **app icon** (adaptive: foreground + background) as in-repo SVG, exported to all `mipmap-*` densities, replacing the default Capacitor icons.
- Generate a branded **splash screen** asset consistent with the icon, exported to all `drawable-*` densities.
- Create **screen illustrations** (SVG) for primary screens / empty states (e.g. dashboard hero, empty habits/journal/mood states) in the glassmorphism + bento style.
- Optimize the bento grid + glassmorphism (consistent radius/blur/borders, responsive spans, mobile performance).
- Produce a **signed release APK** using a generated keystore and a `signingConfig` in `app/build.gradle`.

**Out of Scope**
- Backend/API changes (Python backend untouched).
- Renaming internal identifiers tied to data/auth (`sathi_auth` cookie, `sathi_*` storage keys, theme key) — left as-is to avoid breaking sessions/persistence.
- iOS packaging and Play Store (AAB) submission.
- New product features or data models.

### User Stories
- As a user, I see the app installed and titled **Shathi** with a unique branded icon, not a default placeholder.
- As a user, screens feel premium with consistent frosted-glass bento cards and friendly illustrations on empty/onboarding states.
- As an installer, I can install a **signed release APK** directly on a device without the "unsigned" blocker.

### Functional Requirements
- Launcher name, splash text, and in-app brand consistently read **Shathi**.
- The app icon renders correctly as an Android adaptive icon (round + square masks) across densities.
- Each targeted screen uses the unified `BentoGrid`/`BentoCard` glass treatment; illustrations render crisply at all DPIs and respect light/dark + daytime tints.
- `npx cap sync` regenerates native assets without manual edits being lost.
- `gradlew assembleRelease` outputs a **signed** `app-release.apk`.

### Non-Functional Requirements
- No regressions to `npm run lint`, `npm run typecheck`, `npm run build`.
- Icon/illustration assets optimized (small SVG source, reasonable PNG sizes) and `backdrop-filter` blur kept performant on low-end Android.
- Keystore credentials kept out of source control (documented, referenced via Gradle properties).

# Technical Design

### Current Implementation
- **Branding**: `src/lib/site.ts` exposes `siteConfig.name = "Sathi"`; i18n strings in `src/i18n/locales/en.json` & `bn.json`; theme key `Sathi-theme` in `theme-provider.tsx`.
- **Capacitor**: `capacitor.config.ts` (`appId: com.shathi.app`, `appName: 'Sereni'`, `server.url: https://shathi.vercel.app`). Already-generated `android/` project; deps `@capacitor/core|cli|android|status-bar|splash-screen` in `package.json`.
- **Android assets**: default Capacitor `ic_launcher*` in `mipmap-*` + `drawable*/ic_launcher_foreground.xml`, `splash.png` in `drawable-(land|port)-*`. `strings.xml` has `app_name=sereni`.
- **Build**: `app/build.gradle` release block has `minifyEnabled false` and **no `signingConfig`** → output is `app-release-unsigned.apk` (verified in prior session).
- **Design system**: `BentoGrid`/`BentoCard`, daytime gradient engine, and glass utilities in `src/app/globals.css` from the prior plan.

### Key Decisions
1. **Brand rename scoped to display strings only** — change `siteConfig.name`, i18n labels, `strings.xml`, and `capacitor.config.ts` `appName` to **Shathi**; do NOT touch `sathi_auth`, storage keys, or theme key (avoids breaking sessions/persistence).
2. **Assets authored as in-repo SVG, exported via `@capacitor/assets`** — keep a single source `assets/icon.svg` + `assets/splash.svg`; run `npx @capacitor/assets generate --android` to produce all densities reproducibly. No external design tools required.
3. **Illustrations as React-inlined / `public/` SVGs** — store screen illustrations under `public/illustrations/` and reference them in empty-state components; style with `currentColor`/CSS vars so they adapt to light/dark + daytime tints.
4. **Signed APK via Gradle `signingConfig`** — generate a keystore with `keytool`, store credentials in `android/keystore.properties` (gitignored), wire a `release` `signingConfig` reading those properties in `app/build.gradle`.

### Proposed Changes
**1. Rebrand to Shathi**
- `src/lib/site.ts`: `name: "Shathi"`, update `title`/`description`/keywords accordingly.
- `src/i18n/locales/en.json` & `bn.json`: update brand label keys to "Shathi".
- `android/app/src/main/res/values/strings.xml`: `app_name` and `title_activity_main` → `Shathi`.
- `capacitor.config.ts`: `appName: 'Shathi'`.

**2. App icon + splash**
- Add `assets/icon.svg` (1024x1024, glassmorphism mark — soft gradient orb / lotus-style motif matching teal-blue/sage palette) and `assets/splash.svg` (2732x2732 centered logo on brand gradient).
- Add `@capacitor/assets` dev dependency; run generator to overwrite `mipmap-*/ic_launcher*` and `drawable-*/splash.png` plus adaptive `ic_launcher_foreground`/`ic_launcher_background`.

**3. Screen illustrations**
- Add `public/illustrations/*.svg` (e.g. `empty-habits.svg`, `empty-journal.svg`, `empty-mood.svg`, `dashboard-hero.svg`) in bento/glass style.
- Wire them into existing empty states (e.g. habits `No habits yet`, journal, mood) and a dashboard accent, using `next/image` or inline `<img>`; ensure dark/daytime adaptation.

**4. Bento/glass optimization**
- Reconcile glass utilities (radius/border/blur/shadow) in `globals.css`; verify responsive `BentoCard` spans collapse to single column on mobile and blur is capped for performance.

**5. Signed release build**
- Generate `shathi-release.keystore` via `keytool`.
- Add `android/keystore.properties` (gitignored) with store/key alias + passwords.
- Edit `android/app/build.gradle`: load `keystore.properties`, add `signingConfigs.release`, reference it from `buildTypes.release`.
- Build `gradlew assembleRelease` → signed `app-release.apk`.

### File Structure
```
assets/icon.svg                                   (new, source)
assets/splash.svg                                 (new, source)
public/illustrations/*.svg                        (new)
src/lib/site.ts                                   (modified: name Shathi)
src/i18n/locales/en.json, bn.json                 (modified: brand)
capacitor.config.ts                               (modified: appName)
android/app/src/main/res/values/strings.xml       (modified: app_name)
android/app/src/main/res/mipmap-*/ic_launcher*    (regenerated)
android/app/src/main/res/drawable-*/splash.png    (regenerated)
android/keystore.properties                       (new, gitignored)
android/app/build.gradle                          (modified: signingConfig)
.gitignore                                         (modified: keystore)
```

### Architecture Diagram
```mermaid
graph TD
  SVG[assets/icon.svg + splash.svg] -->|@capacitor/assets generate| Res[android res mipmap/drawable]
  Brand[siteConfig + i18n + strings.xml + capacitor.config] --> App[Shathi UI]
  Ill[public/illustrations/*.svg] --> Screens[Empty states + dashboard]
  Screens --> App
  Res --> Gradle[gradlew assembleRelease]
  KS[keystore.properties + signingConfig] --> Gradle
  Gradle --> APK[signed app-release.apk]
```

### Risks
- **Lost native assets on `cap sync`**: regenerate icons/splash from SVG source after each sync; keep SVG sources in repo.
- **Keystore leakage**: never commit keystore/passwords; gitignore + document.
- **Illustration theming**: ensure SVGs use CSS vars/`currentColor` so they don't clash with dark/daytime backgrounds.
- **Brand string mismatch**: search-and-verify all user-facing "Sathi/Sereni" display strings are updated while leaving auth/storage identifiers intact.

# Testing

### Validation Approach
Validate via the existing static pipeline plus native build verification and manual visual inspection in the dev server and the installed Android app.

### Key Scenarios
- `npm run lint`, `npm run typecheck`, `npm run build` all pass after rebrand + illustration wiring.
- Launcher shows **Shathi** with the new custom icon (square + round mask) across densities.
- Splash screen shows the branded asset; status bar tint unaffected/consistent.
- Empty states (habits/journal/mood) and dashboard render the new illustrations correctly in light, dark, and each daytime period.
- `gradlew assembleRelease` produces a **signed** `app-release.apk`; verify signature (e.g. `apksigner verify`).

### Edge Cases
- Adaptive icon foreground stays within the safe zone (not clipped by round mask).
- Illustrations remain crisp on xxxhdpi and don't overflow bento cards in en/bn.
- `npx cap sync` does not revert the regenerated icons/splash.
- Missing/incorrect `keystore.properties` fails the build with a clear message (documented), not silently unsigned.

### Test Changes
- No automated UI tests exist; rely on lint/typecheck/build plus manual device verification and `apksigner verify` for the signed APK.

# Delivery Steps

### ✓ Step 1: Rebrand the app to Shathi
All user-facing surfaces display the brand name "Shathi".

- Set `siteConfig.name` to `Shathi` in `src/lib/site.ts` and update `title`/`description`/keywords accordingly.
- Update brand label strings in `src/i18n/locales/en.json` and `bn.json`.
- Set `app_name` and `title_activity_main` to `Shathi` in `android/app/src/main/res/values/strings.xml`.
- Set `appName: 'Shathi'` in `capacitor.config.ts`.
- Leave internal identifiers (`sathi_auth` cookie, `sathi_*` storage keys, theme key) untouched to avoid breaking sessions/persistence.
- Verify `npm run lint`, `typecheck`, and `build` stay green.

### ✓ Step 2: Create the Shathi app icon and splash
A custom branded adaptive icon and splash replace the default Capacitor assets across all densities.

- Add source `assets/icon.svg` (1024x1024 glassmorphism mark in the teal-blue/sage palette) and `assets/splash.svg` (centered logo on brand gradient).
- Add `@capacitor/assets` as a dev dependency.
- Run `npx @capacitor/assets generate --android` to regenerate `mipmap-*/ic_launcher*`, adaptive foreground/background, and `drawable-*/splash.png`.
- Run `npx cap sync` and confirm assets persist; verify icon renders with round and square masks.

### ✓ Step 3: Design and wire screen illustrations
Key screens and empty states show on-brand glass/bento illustrations that adapt to theme and daytime.

- Add `public/illustrations/*.svg` (e.g. `empty-habits.svg`, `empty-journal.svg`, `empty-mood.svg`, `dashboard-hero.svg`) in the glassmorphism style using CSS vars/`currentColor`.
- Wire them into existing empty states (habits `No habits yet`, journal, mood) and a dashboard accent.
- Ensure correct rendering in light/dark and each daytime period, and no overflow in en/bn.
- Confirm lint/typecheck/build stay green.

### ✓ Step 4: Optimize bento grid and glassmorphism
The bento + glass system is visually consistent and performant on mobile.

- Reconcile glass utilities (radius, border, blur, layered shadow) in `src/app/globals.css`.
- Verify `BentoCard` responsive spans collapse to a single column on mobile across the migrated screens.
- Cap `backdrop-filter` blur and avoid nested glass stacks for low-end Android performance.
- Manually inspect dashboard and primary screens at mobile/tablet/desktop breakpoints.

### ✓ Step 5: Produce a signed production APK
`gradlew assembleRelease` outputs a signed, installable `app-release.apk`.

- Generate `shathi-release.keystore` via `keytool` and create `android/keystore.properties` (gitignored) with store/key alias and passwords.
- Add `keystore.properties` and the keystore to `.gitignore`.
- Edit `android/app/build.gradle` to load `keystore.properties`, define `signingConfigs.release`, and reference it from `buildTypes.release`.
- Run `gradlew assembleRelease`, confirm a signed `app-release.apk`, and verify with `apksigner verify`.
- Document the keystore generation and build commands.