import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

const ORIGINAL_USER_AGENT = navigator.userAgent;

function setUserAgent(value) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value });
}

const { default: AppSplashScreen } = await import("./AppSplashScreen");

describe("AppSplashScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    setUserAgent(ORIGINAL_USER_AGENT);
    vi.useRealTimers();
  });

  it("renders nothing on a normal web visit", () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15");
    const { container } = render(<AppSplashScreen />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the splash immediately when running inside the wrapped app", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
    render(<AppSplashScreen />);
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("is hidden from assistive tech (purely decorative, real content is already rendered underneath)", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
    const { container } = render(<AppSplashScreen />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("starts fading after the minimum display duration, then unmounts after the fade completes", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
    const { container } = render(<AppSplashScreen />);

    act(() => vi.advanceTimersByTime(1100));
    expect(container.firstChild.className).toMatch(/fadingOut/);
    expect(container.firstChild).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(350));
    expect(container.firstChild).toBeNull();
  });

  it("clears its timers on unmount instead of leaking a late setState", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
    const clearSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<AppSplashScreen />);

    unmount();
    expect(clearSpy).toHaveBeenCalled();

    // No React "state update on unmounted component" warning fires even
    // after the timers would otherwise have gone off.
    act(() => vi.advanceTimersByTime(2000));
  });
});
