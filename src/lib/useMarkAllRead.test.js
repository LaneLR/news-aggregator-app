import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));

const { useMarkAllRead } = await import("./useMarkAllRead");

function makeArticles() {
  return [
    { url: "https://a", isRead: false },
    { url: "https://b", isRead: true },
  ];
}

describe("useMarkAllRead", () => {
  beforeEach(() => {
    mockSession = null;
    global.fetch = vi.fn();
  });

  it("hasUnread is false when logged out, even with unread articles", () => {
    const { result } = renderHook(() => useMarkAllRead(makeArticles(), vi.fn()));
    expect(result.current.hasUnread).toBe(false);
  });

  it("hasUnread is true when logged in and some articles are unread", () => {
    mockSession = makeSession();
    const { result } = renderHook(() => useMarkAllRead(makeArticles(), vi.fn()));
    expect(result.current.hasUnread).toBe(true);
  });

  it("hasUnread is false when logged in but everything is already read", () => {
    mockSession = makeSession();
    const allRead = [{ url: "https://a", isRead: true }];
    const { result } = renderHook(() => useMarkAllRead(allRead, vi.fn()));
    expect(result.current.hasUnread).toBe(false);
  });

  it("does nothing when logged out", async () => {
    const setArticles = vi.fn();
    const { result } = renderHook(() => useMarkAllRead(makeArticles(), setArticles));

    await act(() => result.current.handleMarkAllRead());

    expect(setArticles).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does nothing when there are no unread articles", async () => {
    mockSession = makeSession();
    const setArticles = vi.fn();
    const allRead = [{ url: "https://a", isRead: true }];
    const { result } = renderHook(() => useMarkAllRead(allRead, setArticles));

    await act(() => result.current.handleMarkAllRead());

    expect(setArticles).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("optimistically marks everything read and POSTs the unread URLs", async () => {
    mockSession = makeSession();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({}));
    let articles = makeArticles();
    const setArticles = vi.fn((updater) => {
      articles = updater(articles);
    });

    const { result, rerender } = renderHook(
      ({ articles }) => useMarkAllRead(articles, setArticles),
      { initialProps: { articles } }
    );

    await act(() => result.current.handleMarkAllRead());

    expect(articles.every((a) => a.isRead)).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("/api/articles/mark-all-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: ["https://a"] }),
    });
    rerender({ articles });
    expect(result.current.markingAllRead).toBe(false);
  });

  it("logs but does not throw when the request fails, and still clears the in-flight flag", async () => {
    mockSession = makeSession();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error("network down"));
    const setArticles = vi.fn();

    const { result } = renderHook(() => useMarkAllRead(makeArticles(), setArticles));

    await act(() => result.current.handleMarkAllRead());

    expect(consoleError).toHaveBeenCalled();
    expect(result.current.markingAllRead).toBe(false);
  });
});
