import { describe, expect, it, vi } from "vitest";

const mockInit = vi.fn();
vi.mock("@sentry/nextjs", () => ({ init: (...args) => mockInit(...args) }));

describe("sentry.edge.config.js", () => {
  it("initializes Sentry with the DSN, full trace sampling, and PII enabled", async () => {
    await import("./sentry.edge.config.js");

    expect(mockInit).toHaveBeenCalledWith({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
      sendDefaultPii: true,
    });
  });
});
