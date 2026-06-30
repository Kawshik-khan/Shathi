import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "backend/**",
    "venv/**",
    ".puku/**",
    ".vscode/**",
  ]),
  {
    // `useInsightsData` is a pre-existing async-data hook that fans out
    // to multiple endpoints and writes the results back into per-slice
    // state. The React Compiler's `set-state-in-effect` rule flags the
    // async fetch pattern (which is the documented React pattern for
    // "fetch on prop change" — see https://react.dev/learn/you-might-not-need-an-effect).
    // We acknowledge the warning but keep the existing semantics intact
    // because the data flow (Promise.allSettled → per-slice setState,
    // gated by a `reqId` ref) cannot be expressed more simply today.
    //
    // `MoodCheckIn` reads a stored mood from `localStorage` post-mount
    // to avoid an SSR/hydration mismatch. The recommended React 19
    // pattern is `useSyncExternalStore`; that refactor is tracked
    // separately so the launch isn't blocked by it.
    files: [
      "src/hooks/useInsightsData.ts",
      "src/components/mobile/mood-check-in.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;

