# Sathi — Login Page PRD

## 1. Product Overview

Product: Sathi — AI-powered mental wellness and physical health companion.

Login Goal: Create a premium, emotionally-safe authentication experience that feels welcoming, calm, and trust-inspiring while minimizing friction.

Emotional UX: Users feel welcomed, calm, supported, safe, and excited to continue their wellness journey.

Design Direction: Apple-level minimalism + Calm app atmosphere + premium wellness SaaS.

---

## 2. Visual Design System

- Background palette: `#F8FBF8`, `#F5FAF5`, `#EEF7EF`.
- Primary greens: `#5DBB63`, `#7ED957`, `#22C55E`.
- Surfaces: white and semi-opaque white `rgba(255,255,255,0.84)`.
- Text: `#0F172A`, `#1E293B`, `#64748B`.
- Border radii: 24px / 28px / 32px.
- Shadows: `0 10px 40px rgba(0,0,0,0.04)`.
- Typography: Inter / Geist / SF Pro; bold headings, generous spacing.

---

## 3. Layout

- Centered floating container with a split-screen layout.
- Desktop: 50/50 split. Mobile: stacked (illustration first).
- Large rounded outer container with soft shadow and glass-like layering.

---

## 4. Left Panel — Emotional Illustration

Purpose: emotional warmth, brand identity, and storytelling.

Elements:
- Top-left `Sathi` logo and small wellness badge.
- Heading: “Welcome back to Sathi 🌿”.
- Supporting text: short, gentle copy.
- Clay-style 3D illustration: happy girl in soft green hoodie interacting with a glowing AI orb.
- Orb: friendly face, soft glow, floating with subtle particles.
- Environment: plants, rounded furniture, soft mint gradient background.

---

## 5. Right Panel — Login Form

Purpose: low-friction, premium authentication.

Elements:
- Small glowing wellness icon above heading.
- Heading + subheading.
- Inputs: Email (left icon), Password (left lock, visibility toggle).
- Remember me and Forgot password in a single row.
- Primary CTA: full-width green pill button with gradient and soft glow.
- Social auth buttons (Google, Apple, Email) as rounded squares.
- Bottom link to Sign up.

Accessibility: WCAG contrast, keyboard navigable, reduced-motion support.

---

## 6. Motion

- Use soft fade-ins, hover elevation, and floating particle motion (Framer Motion).
- Respect `prefers-reduced-motion`.

---

## 7. Frontend Execution Notes

- Tech: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Lucide icons, Zustand for state.
- Architecture: `/app/auth/login`, `/components/auth`, `/components/illustrations`, `/components/ui`, `/lib`, `/styles`.
- Deliverables: production-ready split-screen `page.tsx`, reusable `LoginForm` and `LoginLayout`, `OrbIllustration` component, accessible inputs, social buttons, and animation hooks.

---

## 8. Next Steps

1. Implement the page and components (scaffolded in code).
2. Connect auth flows (Supabase, OAuth providers) in a follow-up PR.
3. Add unit/visual tests and polish micro-interactions in staging.

