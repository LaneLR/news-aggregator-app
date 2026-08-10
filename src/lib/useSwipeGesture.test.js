import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSwipeGesture } from "./useSwipeGesture";

// Same rationale as usePullToRefresh.test.js: swipeHandlers are plain
// callback props, so calling them directly with a minimal touch-like object
// exercises the real code path without depending on jsdom's unreliable
// synthetic TouchEvent dispatch.
function touchAt(clientX) {
  return { touches: [{ clientX }] };
}

describe("useSwipeGesture", () => {
  it("starts at rest", () => {
    const { result } = renderHook(() => useSwipeGesture({}));
    expect(result.current.offsetX).toBe(0);
    expect(result.current.isSwiping).toBe(false);
  });

  it("marks isSwiping true on touch start", () => {
    const { result } = renderHook(() => useSwipeGesture({}));
    act(() => result.current.swipeHandlers.onTouchStart(touchAt(100)));
    expect(result.current.isSwiping).toBe(true);
  });

  it("tracks drag distance, clamped to MAX_DRAG in both directions", () => {
    const { result } = renderHook(() => useSwipeGesture({}));

    act(() => result.current.swipeHandlers.onTouchStart(touchAt(200)));
    act(() => result.current.swipeHandlers.onTouchMove(touchAt(250)));
    expect(result.current.offsetX).toBe(50);

    act(() => result.current.swipeHandlers.onTouchMove(touchAt(600)));
    expect(result.current.offsetX).toBe(120); // capped at MAX_DRAG

    act(() => result.current.swipeHandlers.onTouchMove(touchAt(-600)));
    expect(result.current.offsetX).toBe(-120); // capped at -MAX_DRAG
  });

  it("onTouchMove before a touch start is a no-op", () => {
    const { result } = renderHook(() => useSwipeGesture({}));
    act(() => result.current.swipeHandlers.onTouchMove(touchAt(300)));
    expect(result.current.offsetX).toBe(0);
  });

  it("fires onSwipeLeft when released past the negative threshold, then resets", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, onSwipeRight }));

    act(() => result.current.swipeHandlers.onTouchStart(touchAt(200)));
    act(() => result.current.swipeHandlers.onTouchMove(touchAt(100))); // delta -100
    act(() => result.current.swipeHandlers.onTouchEnd());

    expect(onSwipeLeft).toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(result.current.offsetX).toBe(0);
    expect(result.current.isSwiping).toBe(false);
  });

  it("fires onSwipeRight when released past the positive threshold", () => {
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight }));

    act(() => result.current.swipeHandlers.onTouchStart(touchAt(0)));
    act(() => result.current.swipeHandlers.onTouchMove(touchAt(100))); // delta +100
    act(() => result.current.swipeHandlers.onTouchEnd());

    expect(onSwipeRight).toHaveBeenCalled();
  });

  it("fires neither callback when released below the threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft, onSwipeRight }));

    act(() => result.current.swipeHandlers.onTouchStart(touchAt(0)));
    act(() => result.current.swipeHandlers.onTouchMove(touchAt(30))); // delta +30, below threshold
    act(() => result.current.swipeHandlers.onTouchEnd());

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("tolerates missing onSwipeLeft/onSwipeRight callbacks", () => {
    const { result } = renderHook(() => useSwipeGesture({}));
    act(() => result.current.swipeHandlers.onTouchStart(touchAt(0)));
    act(() => result.current.swipeHandlers.onTouchMove(touchAt(200)));
    expect(() => act(() => result.current.swipeHandlers.onTouchEnd())).not.toThrow();
  });
});
