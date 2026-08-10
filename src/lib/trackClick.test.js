import { describe, expect, it, vi, afterEach } from "vitest";
import { trackArticleClick } from "./trackClick";

describe("trackArticleClick", () => {
  afterEach(() => {
    delete navigator.sendBeacon;
  });

  it("does nothing when the article has no url", () => {
    navigator.sendBeacon = vi.fn();
    trackArticleClick({});
    trackArticleClick(null);
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("uses sendBeacon when available", () => {
    navigator.sendBeacon = vi.fn(() => true);
    trackArticleClick({
      url: "https://example.com/a",
      sourceName: "Example",
      category: ["Business"],
    });

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const [endpoint, blob] = navigator.sendBeacon.mock.calls[0];
    expect(endpoint).toBe("/api/articles/click");
    expect(blob).toBeInstanceOf(Blob);
  });

  it("falls back to fetch with keepalive when sendBeacon is unavailable", () => {
    navigator.sendBeacon = undefined;
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));

    trackArticleClick({ url: "https://example.com/b" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/articles/click",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        body: expect.stringContaining("https://example.com/b"),
      })
    );
  });

  it("swallows a fetch rejection instead of throwing", async () => {
    navigator.sendBeacon = undefined;
    global.fetch = vi.fn(() => Promise.reject(new Error("network down")));

    expect(() => trackArticleClick({ url: "https://example.com/c" })).not.toThrow();
    // Let the fire-and-forget .catch() microtask run.
    await Promise.resolve();
    await Promise.resolve();
  });

  it("never throws even if constructing the payload fails", () => {
    navigator.sendBeacon = vi.fn(() => {
      throw new Error("beacon exploded");
    });
    expect(() => trackArticleClick({ url: "https://example.com/d" })).not.toThrow();
  });
});
