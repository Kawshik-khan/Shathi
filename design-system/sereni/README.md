# Using ui-ux-pro-max-skill with Sereni

The `ui-ux-pro-max-skill` (nextlevelbuilder) is installed at
`.claude/skills/ui-ux-pro-max/` (Claude Code) and `.agents/skills/ui-ux-pro-max/`
(Antigravity, mirrored). It is a **secondary reference** for stack patterns, chart
recommendations, and UX guidelines — **not** the design system source of truth.

**Authoritative design system:** [`docs/UI_REDESIGN_PLAN.md`](../../docs/UI_REDESIGN_PLAN.md)
(Sathi UI Redesign Plan, 1,474 lines). All color, typography, spacing, shadow,
motion, and component tokens live there. Implemented in `src/app/globals.css` and
`src/components/ui/` (PR1–PR4).

This directory (`design-system/sereni/`) exists for two reasons:

1. The skill's CLI expects a `design-system/<project>/MASTER.md` to be present.
   `MASTER.md` here is a thin pointer file (not a duplicate of the plan).
2. Per-route divergences from the plan live in `pages/<route>.md` so each page can
   have its own spec without bloating the plan.

---

## How to query the skill

Use the Python entry point in `.claude/skills/ui-ux-pro-max/scripts/`:

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "your query" \
  --domain {style|color|chart|landing|product|ux|typography|icons|react|web|google-fonts} \
  --stack {react|nextjs|shadcn|...} \
  --max-results 3 \
  --format markdown
```

> **Always pass `--max-results 3` and `--format markdown`.** Default `--json` is
> noisy; default `--max-results` returns 1, which misses useful adjacent options.

### Recommended queries (PR5/PR6)

| Need | Query | Plan section |
|---|---|---|
| Mood heatmap chart type | `python .claude/skills/ui-ux-pro-max/scripts/search.py "mood calendar heatmap" --domain chart` | §3.7 (chart tokens) + §7.2 (mood) |
| Sleep trend chart | `python .claude/skills/ui-ux-pro-max/scripts/search.py "sleep duration line chart" --domain chart` | §3.7 + §7.5 |
| Accessible contrast rules | `python .claude/skills/ui-ux-pro-max/scripts/search.py "wcag contrast" --domain ux` | §10 (pre-delivery) |
| Form validation patterns | `python .claude/skills/ui-ux-pro-max/scripts/search.py "form validation error" --stack shadcn` | §6 (component spec) |
| Streak gamification | `python .claude/skills/ui-ux-pro-max/scripts/search.py "streak gamification badge" --domain ux` | §7.3 (habits) |
| Crisis UI patterns | `python .claude/skills/ui-ux-pro-max/scripts/search.py "crisis resources safety" --domain ux` | §8.8 (crisis) — skill returns 0 results; use plan only |
| Bilingual typography | `python .claude/skills/ui-ux-pro-max/scripts/search.py "multilingual font fallback" --domain typography` | §4.4 (i18n + বাংলা) |
| Next.js App Router patterns | `python .claude/skills/ui-ux-pro-max/scripts/search.py "server component" --stack nextjs` | (plan covers this in §6) |
| Bento grid dashboard | `python .claude/skills/ui-ux-pro-max/scripts/search.py "bento grid dashboard" --domain style` | §7.1 (dashboard) |
| Recharts configuration | `python .claude/skills/ui-ux-pro-max/scripts/search.py "recharts responsive" --stack react` | §3.7 |

---

## What the skill returns vs what the plan says

The skill's auto-generated `--design-system` output and the plan frequently
disagree. When they do, **the plan wins**. The table below documents known
conflicts so the next agent doesn't waste a debugging cycle on them.

| Topic | Skill suggests | Plan says | Winner |
|---|---|---|---|
| Primary color | `#7C3AED` lavender | `--p-sage-500` (#4F7E6B) | Plan (§3.2) |
| Accent / CTA | `#D97706` amber | `--color-accent-energy` (#7FB89A) | Plan (§3.3) |
| Background | `#FAF5FF` lilac | 3-layer radial + sand base | Plan (§3.6) |
| Heading font | Lora | Fraunces | Plan (§4) |
| Body font | Raleway | Inter | Plan (§4) |
| Stats font | (not specified) | JetBrains Mono | Plan (§4) |
| Bengali fallback | (not specified) | local Bengali subset → Noto Sans Bengali | Plan (§4.4) |
| Mood ramp | "blue sad → yellow happy" | sage-anchored `--mood-awful / low / neutral / good / great` | Plan (§3.3 + §7.2) |
| Font loading | `@import url('fonts.googleapis.com/...')` | `next/font/local` in `layout.tsx` | Plan (§4) |
| Tailwind version | v3-era (HSL channel vars, `bg-blue-500`) | v4 (`@theme inline` + hex) | Plan (§6) |
| Crisis resources | 0 results in UX CSV | Plan §8.8 (CrisisBanner rules) | Plan |
| Bento dashboard | "Bento Box Grid" style | Plan §7.1 dashboard layout | Plan |

---

## What NOT to do

- **Do not run `search.py ... --design-system --persist`** on this project. It would
  overwrite `MASTER.md` with skill defaults and re-introduce the lavender/Lora
  conflict. If you need a fresh design-system generation for a side project, run it
  in a sandbox; never in this repo.
- **Do not add `@import url('https://fonts.googleapis.com/...')` to globals.css.**
  Fonts load via `next/font/local` in `src/app/layout.tsx`. CDN @imports break
  offline builds (PWA / install-to-home-screen targets have no network at first launch).
- **Do not copy skill-suggested hex values into components or globals.css.** All
  values must come from the plan's Layer 1 primitive table (§3).
- **Do not write a competing `MASTER.md` from skill data.** This file is a pointer;
  the plan is the spec.

---

## Editing rules

1. **Token changes → edit `docs/UI_REDESIGN_PLAN.md` + `src/app/globals.css`.**
   `MASTER.md` here does not duplicate tokens; it points to the plan.
2. **Per-route divergences → edit `design-system/sereni/pages/<route>.md`.**
   Page overrides only list **what differs from the plan**, not full specs.
3. **Adding a new route override** → create `pages/<new-route>.md` following the
   structure in `pages/dashboard.md` (sections + divergences + components +
   data sources + i18n + pre-delivery checks). Keep divergences short.

---

## Skill installation footprint

| Path | Purpose |
|---|---|
| `.claude/skills/ui-ux-pro-max/` | Claude Code skill (generated by `uipro init --ai claude`) |
| `.agents/skills/ui-ux-pro-max/` | Antigravity skill (mirrored from `.claude/`) |
| `design-system/sereni/` | This directory — pointer + per-route overrides |
| `docs/UI_REDESIGN_PLAN.md` | **Authoritative** design system spec |
| `src/app/globals.css` | **Implemented** tokens (the plan, as CSS) |
| `src/components/ui/` | Component primitives (PR2) |
| `src/components/layout/` | Layout shell (PR3) |
| `src/components/landing/` | Landing page (PR4) |
