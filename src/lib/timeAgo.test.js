import { describe, expect, it, afterEach, vi } from "vitest";
import { timeAgo } from "./timeAgo";

describe("timeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty string for falsy input", () => {
    expect(timeAgo(null)).toBe("");
    expect(timeAgo(undefined)).toBe("");
    expect(timeAgo("")).toBe("");
  });

  it("returns an empty string for an unparseable date", () => {
    expect(timeAgo("not-a-date")).toBe("");
  });

  it("returns 'just now' for a time under a minute ago", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    vi.setSystemTime(now);
    expect(timeAgo(new Date(now.getTime() - 30 * 1000).toISOString())).toBe("just now");
  });

  it("formats minutes ago", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    vi.setSystemTime(now);
    expect(timeAgo(new Date(now.getTime() - 5 * 60 * 1000).toISOString())).toBe("5m ago");
  });

  it("formats hours ago", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    vi.setSystemTime(now);
    expect(timeAgo(new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString())).toBe("3h ago");
  });

  it("formats days ago", () => {
    const now = new Date("2026-01-10T12:00:00.000Z");
    vi.setSystemTime(now);
    expect(timeAgo(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString())).toBe("2d ago");
  });

  it("formats weeks ago", () => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    vi.setSystemTime(now);
    expect(timeAgo(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString())).toBe("2w ago");
  });

  it("formats months ago", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    vi.setSystemTime(now);
    expect(timeAgo(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString())).toBe("3mo ago");
  });

  it("formats years ago", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    vi.setSystemTime(now);
    expect(timeAgo(new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString())).toBe("1y ago");
  });
});
