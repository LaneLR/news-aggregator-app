import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

const { default: AppSplashScreen } = await import("./AppSplashScreen");

describe("AppSplashScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is visible on its very first render, with no client-side detection delay", () => {
    // The gap this used to leave (visible only after a useEffect flipped a
    // "hidden" -> "visible" state post-mount) was a real, reported bug: a
    // white flash and the raw loading.jsx dots showing before the splash
    // ever appeared. This component is only ever rendered at all when the
    // server has already confirmed the request is from the wrapped app
    // (see layout.jsx's isNativeApp gate), so there's no client detection
    // left to wait on — it must render visible synchronously, the same on
    // its first (server) render as everywhere else.
    const { container } = render(<AppSplashScreen />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("starts fading after the minimum display duration, then unmounts after the fade completes", () => {
    const { container } = render(<AppSplashScreen />);

    act(() => vi.advanceTimersByTime(1100));
    expect(container.firstChild.className).toMatch(/fadingOut/);
    expect(container.firstChild).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(350));
    expect(container.firstChild).toBeNull();
  });

  it("clears its timers on unmount instead of leaking a late setState", () => {
    const clearSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<AppSplashScreen />);

    unmount();
    expect(clearSpy).toHaveBeenCalled();

    // No React "state update on unmounted component" warning fires even
    // after the timers would otherwise have gone off.
    act(() => vi.advanceTimersByTime(2000));
  });
});
