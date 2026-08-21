import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePullToRefresh } from "./usePullToRefresh";

// pullHandlers are plain callback props meant to be spread onto a JSX
// element's onTouchStart/onTouchMove/onTouchEnd — calling them directly with
// a minimal touch-like object is both sufficient and more reliable here than
// dispatching real TouchEvents (which this environment has previously
// confirmed doesn't reliably trigger gesture behavior even for known-working
// code), since it exercises exactly the same code path the DOM would invoke.
function setScrollY(value) {
  Object.defineProperty(window, "scrollY", { value, configurable: true, writable: true });
}

function touchAt(clientY, clientX = 0) {
  return { touches: [{ clientY, clientX }] };
}

describe("usePullToRefresh", () => {
  beforeEach(() => {
    setScrollY(0);
  });

  it("starts at rest", () => {
    const { result } = renderHook(() => usePullToRefresh(vi.fn()));
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("tracks a downward pull at half-rate, capped at MAX_PULL", () => {
    const { result } = renderHook(() => usePullToRefresh(vi.fn()));

    act(() => result.current.pullHandlers.onTouchStart(touchAt(100)));
    act(() => result.current.pullHandlers.onTouchMove(touchAt(150)));
    expect(result.current.pullDistance).toBe(25); // 50 * 0.5

    act(() => result.current.pullHandlers.onTouchMove(touchAt(500)));
    expect(result.current.pullDistance).toBe(120); // capped at MAX_PULL
  });

  it("ignores an upward drag (never goes negative)", () => {
    const { result } = renderHook(() => usePullToRefresh(vi.fn()));

    act(() => result.current.pullHandlers.onTouchStart(touchAt(100)));
    act(() => result.current.pullHandlers.onTouchMove(touchAt(50)));

    expect(result.current.pullDistance).toBe(0);
  });

  it("bails out once movement is more horizontal than vertical, so a carousel swipe at the top of the page isn't fought", () => {
    const { result } = renderHook(() => usePullToRefresh(vi.fn()));

    act(() => result.current.pullHandlers.onTouchStart(touchAt(100, 100)));
    // Mostly horizontal (dx 60) with only slight vertical drift (dy 10).
    act(() => result.current.pullHandlers.onTouchMove(touchAt(110, 160)));
    expect(result.current.pullDistance).toBe(0);

    // Once bailed, a later touchmove in the same gesture (even a vertical
    // one) stays inert until the next touchstart.
    act(() => result.current.pullHandlers.onTouchMove(touchAt(300, 160)));
    expect(result.current.pullDistance).toBe(0);
  });

  it("still tracks a pull that starts with only slight horizontal drift", () => {
    const { result } = renderHook(() => usePullToRefresh(vi.fn()));

    act(() => result.current.pullHandlers.onTouchStart(touchAt(100, 100)));
    // Mostly vertical (dy 60) with only slight horizontal drift (dx 10).
    act(() => result.current.pullHandlers.onTouchMove(touchAt(160, 110)));
    expect(result.current.pullDistance).toBe(30); // 60 * 0.5
  });

  it("does not start tracking when the page is already scrolled down", () => {
    setScrollY(50);
    const { result } = renderHook(() => usePullToRefresh(vi.fn()));

    act(() => result.current.pullHandlers.onTouchStart(touchAt(100)));
    act(() => result.current.pullHandlers.onTouchMove(touchAt(200)));

    expect(result.current.pullDistance).toBe(0);
  });

  it("calls onRefresh and resets once the pull clears the threshold", async () => {
    const onRefresh = vi.fn().mockResolvedValue();
    const { result } = renderHook(() => usePullToRefresh(onRefresh));

    act(() => result.current.pullHandlers.onTouchStart(touchAt(0)));
    act(() => result.current.pullHandlers.onTouchMove(touchAt(200))); // 100 >= 70 threshold

    await act(() => result.current.pullHandlers.onTouchEnd());

    expect(onRefresh).toHaveBeenCalled();
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
  });

  it("resets without calling onRefresh when released below the threshold", async () => {
    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh(onRefresh));

    act(() => result.current.pullHandlers.onTouchStart(touchAt(0)));
    act(() => result.current.pullHandlers.onTouchMove(touchAt(50))); // 25 < 70 threshold

    await act(() => result.current.pullHandlers.onTouchEnd());

    expect(onRefresh).not.toHaveBeenCalled();
    expect(result.current.pullDistance).toBe(0);
  });

  it("onTouchEnd is a no-op when no touch was ever started", async () => {
    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh(onRefresh));

    await act(() => result.current.pullHandlers.onTouchEnd());

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
