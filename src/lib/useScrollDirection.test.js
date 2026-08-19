import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useScrollDirection } from "./useScrollDirection";

function setScrollY(value) {
  Object.defineProperty(window, "scrollY", { value, configurable: true, writable: true });
}

function scroll(value) {
  setScrollY(value);
  act(() => window.dispatchEvent(new Event("scroll")));
}

describe("useScrollDirection", () => {
  let rafSpy;

  beforeEach(() => {
    setScrollY(0);
    // Runs the rAF callback synchronously so scroll -> state update happens
    // within the same act() instead of needing to await a real animation
    // frame in every test.
    rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb();
      return 0;
    });
  });

  it("starts with no direction and scrollY 0", () => {
    const { result } = renderHook(() => useScrollDirection());
    expect(result.current.direction).toBeNull();
    expect(result.current.scrollY).toBe(0);
  });

  it("reports 'down' after scrolling down past the noise threshold", () => {
    const { result } = renderHook(() => useScrollDirection());
    scroll(50);
    expect(result.current.direction).toBe("down");
    expect(result.current.scrollY).toBe(50);
  });

  it("reports 'up' after scrolling back up past the noise threshold", () => {
    const { result } = renderHook(() => useScrollDirection());
    scroll(200);
    scroll(140);
    expect(result.current.direction).toBe("up");
    expect(result.current.scrollY).toBe(140);
  });

  it("ignores sub-threshold jitter without flipping direction", () => {
    const { result } = renderHook(() => useScrollDirection());
    scroll(200);
    expect(result.current.direction).toBe("down");

    scroll(197); // 3px up — under the 5px noise threshold
    expect(result.current.direction).toBe("down");
    expect(result.current.scrollY).toBe(197);
  });

  it("never reports a negative scrollY", () => {
    setScrollY(-30); // some mobile browsers report negative values during bounce
    const { result } = renderHook(() => useScrollDirection());
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(result.current.scrollY).toBe(0);
  });

  it("removes the scroll listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollDirection());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("coalesces multiple scroll events within one animation frame", () => {
    rafSpy.mockRestore();
    let capturedCallback;
    rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      capturedCallback = cb;
      return 0;
    });

    renderHook(() => useScrollDirection());
    setScrollY(10);
    act(() => window.dispatchEvent(new Event("scroll")));
    setScrollY(20);
    act(() => window.dispatchEvent(new Event("scroll")));

    // Only the first scroll event's rAF should have been scheduled — the
    // second is coalesced away by the `ticking` guard while one is pending.
    expect(rafSpy).toHaveBeenCalledTimes(1);
    act(() => capturedCallback());
  });
});
