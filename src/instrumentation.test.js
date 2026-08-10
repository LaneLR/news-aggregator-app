import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCaptureRequestError = vi.fn();
vi.mock("@sentry/nextjs", () => ({ captureRequestError: mockCaptureRequestError }));

// These are dynamically imported by register() based on NEXT_RUNTIME —
// mock them as modules with side-effect-tracking so we can assert which
// one got loaded without actually running real Sentry.init() again (that's
// covered by sentry.server.config.test.js / sentry.edge.config.test.js).
const serverConfigLoaded = vi.fn();
vi.mock("../sentry.server.config.js", () => {
  serverConfigLoaded();
  return {};
});
const edgeConfigLoaded = vi.fn();
vi.mock("../sentry.edge.config.js", () => {
  edgeConfigLoaded();
  return {};
});

const { register, onRequestError } = await import("./instrumentation.js");

describe("instrumentation.js", () => {
  beforeEach(() => {
    serverConfigLoaded.mockClear();
    edgeConfigLoaded.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads the Node Sentry config when NEXT_RUNTIME is nodejs", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    await register();

    expect(serverConfigLoaded).toHaveBeenCalled();
    expect(edgeConfigLoaded).not.toHaveBeenCalled();
  });

  it("loads the edge Sentry config when NEXT_RUNTIME is edge", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");

    await register();

    expect(edgeConfigLoaded).toHaveBeenCalled();
    expect(serverConfigLoaded).not.toHaveBeenCalled();
  });

  it("loads neither config for an unrecognized runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "browser");

    await register();

    expect(serverConfigLoaded).not.toHaveBeenCalled();
    expect(edgeConfigLoaded).not.toHaveBeenCalled();
  });

  it("exports onRequestError as Sentry's captureRequestError", () => {
    expect(onRequestError).toBe(mockCaptureRequestError);
  });
});
