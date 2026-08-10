import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSentryInit = vi.fn();
const mockCaptureRouterTransitionStart = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  init: (...args) => mockSentryInit(...args),
  captureRouterTransitionStart: mockCaptureRouterTransitionStart,
}));

const mockPosthogInit = vi.fn();
vi.mock("posthog-js", () => ({
  default: { init: (...args) => mockPosthogInit(...args) },
}));

describe("instrumentation-client.js", () => {
  beforeEach(() => {
    mockSentryInit.mockClear();
    mockPosthogInit.mockClear();
    // The module runs its init calls as a side effect of being imported —
    // reset the module cache each test so each vi.stubEnv takes effect on
    // a fresh import instead of reusing the first import's cached result.
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initializes Sentry unconditionally with the DSN and PII enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    await import("./instrumentation-client.js");

    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1,
        sendDefaultPii: true,
      })
    );
  });

  it("does not initialize PostHog when NEXT_PUBLIC_POSTHOG_KEY isn't set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    await import("./instrumentation-client.js");

    expect(mockPosthogInit).not.toHaveBeenCalled();
  });

  it("initializes PostHog with the key and host when NEXT_PUBLIC_POSTHOG_KEY is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://posthog.example.com");

    await import("./instrumentation-client.js");

    expect(mockPosthogInit).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ api_host: "https://posthog.example.com" })
    );
  });

  it("falls back to the default PostHog host when none is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

    await import("./instrumentation-client.js");

    expect(mockPosthogInit).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ api_host: "https://us.i.posthog.com" })
    );
  });

  it("exports onRouterTransitionStart as Sentry's captureRouterTransitionStart", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    const mod = await import("./instrumentation-client.js");

    expect(mod.onRouterTransitionStart).toBe(mockCaptureRouterTransitionStart);
  });
});
