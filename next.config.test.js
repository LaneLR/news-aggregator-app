import { createRequire } from "node:module";
import { afterAll, describe, expect, it, vi } from "vitest";

// next.config.js is a plain CommonJS file (no "type": "module" in
// package.json) — its `require("@sentry/nextjs")` call is handled by
// Node's native CJS loader, which isn't routed through Vitest's own
// module graph, so `vi.mock("@sentry/nextjs", ...)` never intercepts it
// (confirmed: the real withSentryConfig ran and threw, since it expects a
// full Next.js build context this test doesn't provide). Pre-seeding
// Node's own require cache for the resolved "@sentry/nextjs" path is what
// actually works, since next.config.js's require() checks that same cache.
const require = createRequire(import.meta.url);
const sentryPath = require.resolve("@sentry/nextjs");
const originalCacheEntry = require.cache[sentryPath];

const mockWithSentryConfig = vi.fn((config) => config);
require.cache[sentryPath] = {
  id: sentryPath,
  filename: sentryPath,
  loaded: true,
  exports: { withSentryConfig: mockWithSentryConfig },
};

afterAll(() => {
  if (originalCacheEntry) {
    require.cache[sentryPath] = originalCacheEntry;
  } else {
    delete require.cache[sentryPath];
  }
});

const nextConfigPath = require.resolve("./next.config.js");
delete require.cache[nextConfigPath];
const nextConfig = require("./next.config.js");

describe("next.config.js", () => {
  it("routes external images only through the local image-proxy patterns (no open remotePatterns)", () => {
    expect(nextConfig.images.remotePatterns).toBeUndefined();
    expect(nextConfig.images.localPatterns).toEqual([
      { pathname: "/images/**", search: "" },
      { pathname: "/api/image-proxy/**" },
    ]);
  });

  it("sets baseline security headers on every route", async () => {
    const headerGroups = await nextConfig.headers();

    expect(headerGroups).toHaveLength(1);
    expect(headerGroups[0].source).toBe("/:path*");
    expect(headerGroups[0].headers).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ])
    );
  });

  it("externalizes sequelize/pg from the server webpack bundle", () => {
    const config = { externals: ["existing-external"] };
    const result = nextConfig.webpack(config, { isServer: true });

    expect(result.externals).toEqual(["existing-external", "sequelize", "pg"]);
  });

  it("leaves the client webpack config's externals untouched", () => {
    const config = { externals: undefined };
    const result = nextConfig.webpack(config, { isServer: false });

    expect(result.externals).toBeUndefined();
  });

  it("wraps the config with withSentryConfig using org/project from env", () => {
    expect(mockWithSentryConfig).toHaveBeenCalledWith(
      expect.objectContaining({ images: expect.any(Object) }),
      expect.objectContaining({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        widenClientFileUpload: true,
      })
    );
  });
});
