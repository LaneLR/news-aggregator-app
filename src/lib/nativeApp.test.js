import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_USER_AGENT = navigator.userAgent;

const browserOpen = vi.fn().mockResolvedValue(undefined);
vi.mock("@capacitor/browser", () => ({ Browser: { open: browserOpen } }));

const { isRunningInNativeApp, openPaymentUrl } = await import("./nativeApp");

function setUserAgent(value) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value });
}

describe("nativeApp", () => {
  beforeEach(() => {
    browserOpen.mockClear();
    delete window.location;
    window.location = { href: "" };
  });

  afterEach(() => {
    setUserAgent(ORIGINAL_USER_AGENT);
  });

  describe("isRunningInNativeApp", () => {
    it("returns false for a normal browser user agent", () => {
      setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15");
      expect(isRunningInNativeApp()).toBe(false);
    });

    it("returns true when the wrapped app's user agent marker is present", () => {
      setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
      expect(isRunningInNativeApp()).toBe(true);
    });
  });

  describe("openPaymentUrl", () => {
    it("navigates the current window on the normal web path", async () => {
      setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15");
      await openPaymentUrl("https://billing.stripe.com/session/abc");

      expect(window.location.href).toBe("https://billing.stripe.com/session/abc");
      expect(browserOpen).not.toHaveBeenCalled();
    });

    it("opens the system browser via Capacitor when inside the wrapped app", async () => {
      setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
      await openPaymentUrl("https://billing.stripe.com/session/abc");

      expect(browserOpen).toHaveBeenCalledWith({ url: "https://billing.stripe.com/session/abc" });
      expect(window.location.href).toBe("");
    });
  });
});
