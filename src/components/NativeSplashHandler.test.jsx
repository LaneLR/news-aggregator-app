import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/react";

const ORIGINAL_USER_AGENT = navigator.userAgent;
const splashHide = vi.fn().mockResolvedValue(undefined);
vi.mock("@capacitor/splash-screen", () => ({ SplashScreen: { hide: splashHide } }));

const { default: NativeSplashHandler } = await import("./NativeSplashHandler");

function setUserAgent(value) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value });
}

describe("NativeSplashHandler", () => {
  beforeEach(() => {
    splashHide.mockClear();
  });

  afterEach(() => {
    setUserAgent(ORIGINAL_USER_AGENT);
  });

  it("renders nothing", () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15");
    const { container } = render(<NativeSplashHandler />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does nothing on a normal web visit", async () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15");
    render(<NativeSplashHandler />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(splashHide).not.toHaveBeenCalled();
  });

  it("hides the native splash screen when running inside the wrapped app", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
    render(<NativeSplashHandler />);
    await waitFor(() => expect(splashHide).toHaveBeenCalledTimes(1));
  });

  it("does not call hide after unmounting mid-import", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
    const { unmount } = render(<NativeSplashHandler />);
    unmount();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(splashHide).not.toHaveBeenCalled();
  });
});
