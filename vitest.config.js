import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// jsdom by default — most of this codebase is client components/hooks and
// API routes that only need Node globals (Request/Response/fetch), both of
// which jsdom + Next's own polyfills cover. Server-only files that truly
// need node-specific behavior aren't common enough here to warrant a
// per-file environment split.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Every App Router convention file (page.js/layout.js/route.js) in this
  // project is named *.js per Next.js's own convention, but many contain
  // JSX — Vite's default transform only parses JSX in .jsx/.tsx, so
  // without this override every one of those files fails to even load in
  // tests with "Unexpected JSX expression". route.js files (no JSX) parse
  // fine either way since 'jsx' loader is a superset of plain JS syntax.
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    css: true,
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/**/*.module.scss",
        "src/app/**/globals.scss",
        "src/test/**",
        "**/*.test.{js,jsx}",
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 85,
        branches: 80,
      },
    },
  },
});
