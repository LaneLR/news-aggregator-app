import { describe, expect, it, vi } from "vitest";

let mockUserAgent = "";
const mockHeaders = vi.fn(() =>
  Promise.resolve({ get: (name) => (name === "user-agent" ? mockUserAgent : null) })
);
vi.mock("next/headers", () => ({ headers: () => mockHeaders() }));

const { isNativeAppRequest } = await import("./isNativeAppRequest");

describe("isNativeAppRequest", () => {
  it("returns false for a normal browser user agent", async () => {
    mockUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";
    expect(await isNativeAppRequest()).toBe(false);
  });

  it("returns true when the wrapped app's user agent marker is present", async () => {
    mockUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App";
    expect(await isNativeAppRequest()).toBe(true);
  });

  it("returns false when the request has no user-agent header at all", async () => {
    mockUserAgent = "";
    expect(await isNativeAppRequest()).toBe(false);
  });
});
