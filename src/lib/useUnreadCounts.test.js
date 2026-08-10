import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));

const { useUnreadCounts } = await import("./useUnreadCounts");

const EMPTY = { categories: {}, feeds: 0, following: 0 };

describe("useUnreadCounts", () => {
  beforeEach(() => {
    mockSession = null;
    global.fetch = vi.fn();
  });

  it("returns the empty shape when logged out and does not fetch", () => {
    const { result } = renderHook(() => useUnreadCounts());
    expect(result.current).toEqual(EMPTY);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches and applies counts once logged in", async () => {
    mockSession = makeSession();
    const counts = { categories: { Business: 3 }, feeds: 2, following: 1 };
    global.fetch.mockResolvedValueOnce(makeFetchResponse(counts));

    const { result } = renderHook(() => useUnreadCounts());

    await waitFor(() => expect(result.current).toEqual(counts));
    expect(global.fetch).toHaveBeenCalledWith("/api/users/unread-counts");
  });

  it("silently keeps stale counts when the response is not ok", async () => {
    mockSession = makeSession();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({}, { ok: false }));

    const { result } = renderHook(() => useUnreadCounts());

    // Give the rejected promise chain a tick to resolve; state should stay
    // at the initial empty shape since the .catch() swallows the error.
    await act(() => Promise.resolve());
    expect(result.current).toEqual(EMPTY);
  });

  it("refetches on window focus", async () => {
    mockSession = makeSession();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ categories: {}, feeds: 1, following: 0 }));
    const { result } = renderHook(() => useUnreadCounts());
    await waitFor(() => expect(result.current.feeds).toBe(1));

    global.fetch.mockResolvedValueOnce(makeFetchResponse({ categories: {}, feeds: 5, following: 0 }));
    act(() => window.dispatchEvent(new Event("focus")));

    await waitFor(() => expect(result.current.feeds).toBe(5));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("resets to empty and stops fetching after logging out", async () => {
    mockSession = makeSession();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ categories: {}, feeds: 4, following: 0 }));
    const { result, rerender } = renderHook(() => useUnreadCounts());
    await waitFor(() => expect(result.current.feeds).toBe(4));

    mockSession = null;
    rerender();

    expect(result.current).toEqual(EMPTY);
  });
});
