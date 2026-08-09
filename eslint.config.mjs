import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// `next lint` was removed in Next.js 16 — lint now runs directly via the
// ESLint CLI (`npm run lint` → `eslint .`), so the ignores `next lint` used
// to apply automatically need to be listed explicitly here instead.
const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Leftover git worktrees from earlier isolated agent runs — not part of
    // the actual source tree.
    ".claude/worktrees/**",
  ]),
  {
    rules: {
      // This rule (new to eslint-plugin-react-hooks, bundled via
      // next/core-web-vitals) flags the extremely common "read
      // localStorage/matchMedia/sessionStorage once on mount and store it in
      // state" pattern used throughout this app (ThemeProvider-adjacent
      // code, FeatureCallout, reader prefs, onboarding flags, etc.). That
      // pattern is a legitimate use of an effect (syncing from an external
      // system), not the "derived state" anti-pattern this rule exists to
      // catch — the "correct" rewrite (a lazy useState initializer) doesn't
      // work when the value can only be read client-side (window/localStorage
      // aren't available during SSR). Downgraded to a warning rather than
      // rewritten across a dozen call sites as a side effect of adding CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
