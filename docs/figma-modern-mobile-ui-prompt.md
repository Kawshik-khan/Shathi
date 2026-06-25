# Figma Prompt — Convert Sereni into a Modern, Memrise-Style Mobile App UI

A comprehensive, copy-paste-ready prompt set for **Figma AI** (Figma Make / First Draft) or AI design tools like **Galileo, Uizard, or v0**. It is built from the **Sereni / Sathi** codebase — its real screens, green wellness palette, glassmorphism system, and Bangla/English bilingual support — and reframes it as a modern, Memrise-style mobile app with strong UX.

## How to Use

- **Figma Make / First Draft**: paste the "Master Prompt" first, then feed the per-screen prompts one at a time to generate individual frames.
- **v0 / Galileo / Uizard**: paste the Master Prompt + one screen prompt per generation.
- Keep the **Design System** block pinned so every screen stays consistent.

---

## Master Prompt (paste this first)

```text
You are a senior product designer. Design a modern, mobile-first iOS/Android app UI in Figma
for "Sereni" — a mental-wellness companion app (AI chat, journaling, mood, habits, sleep,
insights). Reimagine it with the playful, motivating, gamified energy of Memrise/Duolingo
but adapted for a calm wellness context (encouraging, not aggressive).

PLATFORM & CANVAS
- Mobile app, 390 x 844 (iPhone 14/15) frames. Design for one-handed use.
- Use Auto Layout, components, variants, and a shared color/text/effect styles library.
- Provide both Light and Dark mode variants of every screen.
- Support a bottom tab bar + safe areas (notch + home indicator).

BRAND & MOOD
- Name: Sereni (also "Sathi"). Calm, warm, hopeful, trustworthy, gently gamified.
- Wellness-first: soft, breathable, low-stress. Gamification motivates without pressure
  (streaks, gentle progress rings, supportive micro-copy), never guilt-driven.

DESIGN SYSTEM (use exactly)
- Primary green: #22C55E; light #7ED957; soft #A7F3A0; muted #DCFCE7.
- Light bg: linear-gradient 135deg #F8FBF8 -> #F3FAF4 -> #EEF7EF. Foreground #171717.
- Dark bg: linear-gradient 135deg #0F1A0F -> #142414 -> #1A2E1A. Foreground #E8F5E8.
  Dark primary #4ADE80.
- Glassmorphism cards: translucent white (rgba(255,255,255,0.72)) with 18px backdrop blur,
  1px light border, soft shadow 0 10px 30px rgba(0,0,0,0.04). Dark glass: rgba(30,50,30,0.8).
- Rounded, friendly geometry: card radius ~28px, pill buttons (radius 9999px),
  inputs radius ~12px.
- Primary CTA: green gradient pill (#7ED957 -> #22C55E), white text, soft green glow shadow.
- Effects: subtle hover/press lift, green glow accents, ambient radial glow behind hero areas.
- Use friendly, rounded illustration/iconography (line icons, 2px), soft mascot-style accents.

TYPOGRAPHY
- Clean geometric sans (Inter/Geist style) for English.
- Full bilingual support: English + Bangla (বাংলা). When language = Bangla, ALL text
  (headings, body, buttons, numbers labels) uses a Bangla font (Hind Siliguri / Noto Sans
  Bengali). Show key screens in both English and Bangla variants. Layout direction stays LTR.
- Type scale: Display 28/Bold, H1 22/SemiBold, H2 18/SemiBold, Body 15/Regular,
  Caption 13/Medium.

GAMIFICATION & UX PRINCIPLES (Memrise-inspired, wellness-tuned)
- Daily streak flame + streak count, progress rings, XP-like "growth points", gentle level/
  milestone badges, and celebratory but calm completion states.
- A guided "daily check-in" path/journey (like Memrise's learning path) chaining
  mood -> journal -> habit -> breathing into one motivating flow with progress dots.
- Micro-interactions: confetti-lite/leaf-burst on completion, animated progress fills,
  haptic-feel button states.
- UX optimizations: reduce taps to log mood/journal (max 2 taps), large touch targets (>=44px),
  clear empty states with encouraging prompts, skeleton loaders, accessible contrast (WCAG AA),
  obvious primary action per screen, and a one-tap crisis/"Reach out now" safety affordance.

NAVIGATION
- Bottom tab bar (5 items): Home, Companion (AI chat), Journal, Insights, Profile.
- A central floating "+" / daily check-in action.

DELIVERABLES
- A consistent component library: buttons, glass cards, mood selector, streak badge,
  progress ring, chat bubbles, input fields, bottom nav, top app bar, list rows, charts.
- All screens listed below in Light + Dark, English + Bangla where noted.
```

---

## Per-Screen Prompts (generate one frame each)

```text
1) ONBOARDING / LANDING — 3-step illustrated onboarding (welcome, set goal/intention,
   pick reminder time + language EN/বাংলা). Big friendly illustration, progress dots,
   green gradient "Get started" pill, social-proof line. Calm, inviting.

2) AUTH (Login + Signup) — minimal glass card, email/password, "continue with Google",
   bilingual labels, friendly mascot accent, clear primary CTA.

3) HOME / DASHBOARD — greeting with name + today's date, large daily streak flame card,
   today's "check-in journey" path (mood -> journal -> habit -> breathe) with progress,
   mood-of-the-day quick logger, growth points/level badge, upcoming reminder,
   one-tap "Talk to companion" card. Glass cards on soft green gradient bg.

4) AI COMPANION (chat) — chat thread with rounded companion + user bubbles, calm avatar,
   typing indicator, quick-reply chips (e.g. "I'm anxious", "Vent", "Breathing"),
   sticky input with mic + send; subtle "safety/Reach out now" pill if distress detected.

5) MOOD — fast mood logger: large emoji/face selector, intensity slider, context tags
   (work, study, family, sleep), optional note, one-tap save. Below: weekly mood
   trend chart + emotion heatmap. Minimize taps (Memrise-style quick flow).

6) JOURNAL — entry list as glass cards with date + mood chip + snippet; floating "+" to
   write; rich entry editor screen with prompts ("What went well today?"), word count,
   save with celebratory micro-animation.

7) HABITS — habit cards with progress rings and streaks, check-off with leaf-burst
   animation, "add habit" sheet, weekly grid, motivational milestone badge.

8) SLEEP — bedtime/wake schedule, last-night duration ring, weekly sleep bar chart,
   sleep quality tags, gentle wind-down reminder card.

9) INSIGHTS — weekly narrative summary card ("Your mood dipped on low-sleep days"),
   burnout gauge, correlation charts (sleep<->mood), 2-3 actionable suggestion cards,
   emotional-growth tracker. Clean data-viz in the green palette.

10) RESOURCES — guided exercises library: breathing, 5-4-3-2-1 grounding, short
    meditations as illustrated cards with duration + "completed" state; localized
    (Bangladesh) crisis hotlines section pinned at top.

11) PROFILE — avatar, level/growth points, streak history calendar, earned badges grid,
    achievements, settings shortcut.

12) SETTINGS — language toggle (English / বাংলা) prominently, theme (light/dark/system),
    reminder & quiet-hours scheduling, notification toggles, privacy/data export +
    delete account, subscription link.

13) SUBSCRIPTION / PAYWALL — Free vs Premium comparison, monthly/yearly pill toggle,
    feature checklist, green gradient "Upgrade" CTA, trust/secure-payment note.

14) STATES — show empty states, loading skeletons, success/celebration overlay, and the
    crisis "Reach out now" full-screen safety panel with hotlines + "SMS a trusted contact".
```

---

## Optional Add-On Prompts

```text
- DESIGN SYSTEM PAGE: generate a Figma page documenting color styles, type styles,
  spacing scale, radius scale, shadows, and all components with their variants
  (default/hover/pressed/disabled) and Light/Dark + EN/BN states.

- MOTION SPEC: describe key micro-interactions (streak flame pulse, progress-ring fill,
  leaf-burst on habit complete, chat bubble entrance, tab switch) with durations/easing.
```

---

## Tips to Get Better Output

- Generate the **Design System page first**, then screens — the AI will reuse the styles for consistency.
- Always request **Light + Dark** and **English + বাংলা** in the same generation so spacing accommodates longer Bangla strings.
- If the tool drifts off-brand, re-paste the `DESIGN SYSTEM` block and add: *"strictly reuse the existing color and type styles, do not introduce new colors."*
- For UX polish, explicitly ask for **empty states, loading skeletons, and error states** — AI tools often skip these.

> This prompt set mirrors the actual app surface (16 routes: dashboard, ai-companion, journal, mood, habits, sleep, insights, resources, profile, settings, subscription, auth, admin, landing) so the Figma output maps cleanly back to the codebase.
