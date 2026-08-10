import { describe, expect, it, vi, beforeEach } from "vitest";

// `new PostHog(...)` requires a real constructor function — an arrow-function
// mockImplementation can't be invoked with `new`.
const PostHogMock = vi.fn().mockImplementation(function (key, options) {
  this.key = key;
  this.options = options;
});

vi.mock("posthog-node", () => ({
  PostHog: PostHogMock,
}));

describe("getPostHogServerClient", () => {
  beforeEach(() => {
    vi.resetModules();
    PostHogMock.mockClear();
  });

  it("returns null when NEXT_PUBLIC_POSTHOG_KEY is not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const { getPostHogServerClient } = await import("./posthog-server");
    expect(getPostHogServerClient()).toBeNull();
    expect(PostHogMock).not.toHaveBeenCalled();
  });

  it("constructs a PostHog client with immediate-flush settings when a key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://custom.posthog.example");
    const { getPostHogServerClient } = await import("./posthog-server");

    const client = getPostHogServerClient();
    expect(PostHogMock).toHaveBeenCalledWith("phc_test_key", {
      host: "https://custom.posthog.example",
      flushAt: 1,
      flushInterval: 0,
    });
    expect(client.key).toBe("phc_test_key");
    expect(client.options).toEqual({
      host: "https://custom.posthog.example",
      flushAt: 1,
      flushInterval: 0,
    });
  });

  it("defaults the host when NEXT_PUBLIC_POSTHOG_HOST is not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const { getPostHogServerClient } = await import("./posthog-server");

    getPostHogServerClient();
    expect(PostHogMock).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ host: "https://us.i.posthog.com" })
    );
  });

  it("reuses the same client instance across calls (singleton)", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    const { getPostHogServerClient } = await import("./posthog-server");

    const first = getPostHogServerClient();
    const second = getPostHogServerClient();
    expect(first).toBe(second);
    expect(PostHogMock).toHaveBeenCalledTimes(1);
  });
});
