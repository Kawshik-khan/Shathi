---
sessionId: session-260625-094004-1ido
---

# Requirements

### Overview & Goals
When the user selects Bangla (`data-language="bn"`), the **entire** UI should render in the Bangla font family — not just body text. Today only the `body` element gets a Bangla font override, so elements using utility/token fonts (`font-heading`, `font-mono`, `font-sf-pro`) and inline `fontFamily` styles still fall back to Latin fonts (Inter / Geist / SF-Pro). This task makes every text surface use the Bangla stack while in Bangla mode.

### Scope
**In Scope**
- Force the Bangla font family for all text when `data-language="bn"`, including:
  - Default/body text (`--font-sans`)
  - Headings (`--font-heading`, used by `card-title`, `dialog-title`)
  - Monospace/code (`--font-mono`)
  - SF-Pro stack (`--font-sf-pro` and `lib/fonts.ts` `sfPro` inline style)
- Keep English (`data-language="en"`) UI unchanged (Inter/Geist/SF-Pro).

**Out of Scope**
- Translating any copy/strings (this is font-only).
- Adding new Bangla webfonts (Hind Siliguri + Noto Sans Bengali are already loaded in `layout.tsx`).
- Changing layout direction (`dir` stays `ltr`).

### Functional Requirements
- Switching the language to Bangla updates **all** visible text — headings, dialog titles, code/mono text, buttons, inputs — to the Bangla font, with no Latin-font islands remaining.
- Switching back to English restores the original fonts everywhere.
- The change is reactive to the existing `i18n` language switch (no reload required), matching current `I18nProvider` behavior that toggles `data-language`.

# Technical Design

### Current Implementation
- **Fonts loaded** in `src/app/layout.tsx`: `Inter` (`--font-sans`), `Geist` (`--font-geist-sans`), `Geist_Mono` (`--font-geist-mono`), `Hind_Siliguri` (`--font-bengali`), `Noto_Sans_Bengali` (`--font-noto-bengali`). All variables are attached to `<html>`.
- **Token mapping** in `src/app/globals.css` `@theme inline`:
  - `--font-sans: var(--font-sans)`
  - `--font-mono: var(--font-geist-mono)`
  - `--font-heading: var(--font-geist)`
  - `--font-sf-pro: -apple-system, … sans-serif`
  These tokens generate the Tailwind utilities `font-sans`, `font-mono`, `font-heading`, `font-sf-pro`.
- **Existing Bangla override** (`globals.css`, ~line 183) only targets `body`:
  ```css
  html[data-language="bn"] body {
    font-family: var(--font-bengali), var(--font-noto-bengali), var(--font-sans), Arial, Helvetica, sans-serif;
  }
  ```
  Because utilities like `font-heading` (used in `components/ui/card.tsx`, `components/ui/dialog.tsx`) and `font-mono` set `font-family` directly, they win over the `body` cascade and stay Latin.
- **Language toggling**: `src/components/i18n-provider.tsx` sets `document.documentElement.dataset.language` on `languageChanged` — already drives the `data-language` attribute.
- **Inline font**: `src/lib/fonts.ts` `sfPro.style.fontFamily` hardcodes the SF-Pro stack (cannot be overridden by CSS variables where applied as an inline style).

### Key Decisions
- **Override CSS font tokens under the `bn` selector, not per-component.** Instead of editing every component, redefine the Bangla stack on the font custom properties scoped to `html[data-language="bn"]`. This automatically propagates to every Tailwind font utility (`font-sans/heading/mono/sf-pro`) because they all resolve their value from those variables at use-site. One CSS change covers the whole app.
- **Define a single reusable Bangla stack variable** (`--font-bengali-stack`) to avoid repetition and keep fallbacks consistent.
- **Bangla mode only**, per user choice — English keeps existing fonts.

### Proposed Changes
1. **`src/app/globals.css`** — replace the single `body`-scoped override with token-level overrides scoped to `html[data-language="bn"]`:
   ```css
   html[data-language="bn"] {
     --font-bengali-stack: var(--font-bengali), var(--font-noto-bengali), Arial, Helvetica, sans-serif;
     --font-sans: var(--font-bengali-stack);
     --font-mono: var(--font-bengali-stack);
     --font-heading: var(--font-bengali-stack);
     --font-sf-pro: var(--font-bengali-stack);
   }
   html[data-language="bn"] body {
     font-family: var(--font-bengali-stack);
   }
   ```
   This forces `font-sans`, `font-mono`, `font-heading`, and `font-sf-pro` utilities to all resolve to the Bangla stack in Bangla mode, while English mode is untouched.
2. **`src/lib/fonts.ts` `sfPro`** — the inline `fontFamily` cannot react to `data-language`. Provide a CSS-class-based path so SF-Pro text also follows the language. The existing `sfPro.className = "font-sf-pro"` already maps to the token; ensure call sites use the class (not the hardcoded inline `style`) so the Bangla override applies. Audit usages and switch any inline-`style` usage of `sfPro` to the `font-sf-pro` class.

### File Structure
- Modified: `src/app/globals.css` (font token overrides for `bn`).
- Modified (if inline usage found): `src/lib/fonts.ts` and any component importing `sfPro` via inline `style`.
- Unchanged: `src/app/layout.tsx` (fonts already loaded), `src/components/i18n-provider.tsx` (already sets `data-language`).

### Risks
- **Tailwind v4 token resolution**: utilities generated from `@theme inline` reference the variable at use-site, so a scoped variable override cascades correctly. If any utility was compiled to a literal value, that specific token would need a direct `html[data-language="bn"] .font-x { font-family: … }` rule — to be verified during validation.
- **Inline `fontFamily` styles** (e.g. `sfPro.style`) are immune to CSS-variable overrides; these must be converted to the class form or given an explicit `bn` rule.

# Testing

### Validation Approach
Build/run the app and toggle the language to Bangla, then confirm no Latin-font text remains. Use a search pass to ensure no hardcoded font escapes the override.

### Key Scenarios
- Switch language to Bangla → page headings (cards, dialogs), body text, buttons, inputs, and any mono/code text all render in the Bangla font.
- Switch back to English → all fonts revert to Inter/Geist/SF-Pro.
- Reload while in Bangla mode → fonts persist (driven by stored language + `data-language`).

### Edge Cases
- `card-title` / `dialog-title` (`font-heading`) — verify they switch (these were previously Latin-only).
- Any element using `font-mono` or `font-sf-pro`.
- Inline `sfPro.style` usages — verify converted to class and now follow Bangla.

### Test Changes
- No automated test framework is set up for styling; validation is via `npm run build` (no errors) plus manual visual verification of the language toggle.

# Delivery Steps

### ✓ Step 1: Override font tokens for Bangla mode in globals.css
In Bangla mode, every Tailwind font utility resolves to the Bangla font stack.

- Edit `src/app/globals.css`.
- Add a `html[data-language="bn"]` block defining a reusable `--font-bengali-stack` (`var(--font-bengali), var(--font-noto-bengali), Arial, Helvetica, sans-serif`).
- Override `--font-sans`, `--font-mono`, `--font-heading`, and `--font-sf-pro` to the Bangla stack within that scope.
- Keep/redefine the `html[data-language="bn"] body` rule to use the same stack.
- Leave English (`data-language="en"`) tokens unchanged.

### ✓ Step 2: Eliminate hardcoded/inline font escapes for SF-Pro
No element keeps a Latin font in Bangla mode due to inline `fontFamily`.

- Audit usages of `sfPro` from `src/lib/fonts.ts` across `src/`.
- Replace any inline `style={{ fontFamily: ... }}` / `sfPro.style` usage with the `font-sf-pro` class so it follows the language-scoped token override.
- Confirm `components/ui/card.tsx` (`card-title`) and `components/ui/dialog.tsx` (`dialog-title`) `font-heading` text now switches to Bangla via the token override.

### ✓ Step 3: Validate the language-wide font switch
Bangla mode shows the Bangla font across all text surfaces with no regressions in English.

- Run `npm run build` to ensure no CSS/TS errors.
- Manually toggle the language and verify headings, dialog titles, body, mono/code, buttons, and inputs all render Bangla.
- Toggle back to English and confirm Inter/Geist/SF-Pro are restored.
- Grep for remaining `fontFamily`/`font-family` declarations to confirm none bypass the `data-language="bn"` override.