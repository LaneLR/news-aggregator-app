import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));

const { useLayoutPrefs, applyCustomOrder } = await import("./useLayoutPrefs");

describe("useLayoutPrefs", () => {
  beforeEach(() => {
    mockSession = null;
    global.fetch = vi.fn();
  });

  it("defaults to 'reader' density and stays unloaded when logged out", () => {
    const { result } = renderHook(() => useLayoutPrefs());
    expect(result.current.viewDensity).toBe("reader");
    expect(result.current.loaded).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches and applies the saved density when logged in", async () => {
    mockSession = makeSession();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ viewDensity: "list" }));

    const { result } = renderHook(() => useLayoutPrefs());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.viewDensity).toBe("list");
    expect(global.fetch).toHaveBeenCalledWith("/api/users/layout-prefs");
  });

  it("normalizes a legacy 'magazine' density (removed) to 'card'", async () => {
    mockSession = makeSession();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ viewDensity: "magazine" }));

    const { result } = renderHook(() => useLayoutPrefs());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.viewDensity).toBe("card");
  });

  it("falls back to 'reader' when the server returns no viewDensity", async () => {
    mockSession = makeSession();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({}));

    const { result } = renderHook(() => useLayoutPrefs());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.viewDensity).toBe("reader");
  });

  it("logs and leaves state unloaded when the fetch fails", async () => {
    mockSession = makeSession();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useLayoutPrefs());

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(result.current.loaded).toBe(false);
  });

  it("setViewDensity updates state immediately and PATCHes when logged in", async () => {
    mockSession = makeSession();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ viewDensity: "reader" }));
    const { result } = renderHook(() => useLayoutPrefs());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    global.fetch.mockResolvedValueOnce(makeFetchResponse({ ok: true }));
    act(() => result.current.setViewDensity("list"));

    expect(result.current.viewDensity).toBe("list");
    expect(global.fetch).toHaveBeenCalledWith("/api/users/layout-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewDensity: "list" }),
    });
  });

  it("setViewDensity updates local state only (no fetch) when logged out", () => {
    const { result } = renderHook(() => useLayoutPrefs());

    act(() => result.current.setViewDensity("card"));

    expect(result.current.viewDensity).toBe("card");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("applyCustomOrder", () => {
  const getKey = (item) => item.key;

  it("returns the items unchanged when no order is given", () => {
    const items = [{ key: "a" }, { key: "b" }];
    expect(applyCustomOrder(items, [], getKey)).toEqual(items);
    expect(applyCustomOrder(items, null, getKey)).toEqual(items);
  });

  it("reorders items to match the saved key order", () => {
    const items = [{ key: "a" }, { key: "b" }, { key: "c" }];
    const result = applyCustomOrder(items, ["c", "a", "b"], getKey);
    expect(result.map(getKey)).toEqual(["c", "a", "b"]);
  });

  it("appends items missing from the saved order at the end, in original relative order", () => {
    const items = [{ key: "a" }, { key: "b" }, { key: "c" }];
    const result = applyCustomOrder(items, ["b"], getKey);
    expect(result.map(getKey)).toEqual(["b", "a", "c"]);
  });

  it("drops keys from the saved order that no longer exist in items", () => {
    const items = [{ key: "a" }, { key: "b" }];
    const result = applyCustomOrder(items, ["ghost", "b"], getKey);
    expect(result.map(getKey)).toEqual(["b", "a"]);
  });
});
