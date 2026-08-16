import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";
import NotificationSettings from "./NotificationSettings";

const ORIGINAL_USER_AGENT = navigator.userAgent;

function setSupportEnvironment({ serviceWorker = true, pushManager = true, notification = true, subscription = null }) {
  if (serviceWorker) {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(subscription),
            subscribe: vi.fn().mockResolvedValue({
              toJSON: () => ({ endpoint: "https://push.example.com/1" }),
              endpoint: "https://push.example.com/1",
              unsubscribe: vi.fn().mockResolvedValue(true),
            }),
          },
        }),
      },
    });
  } else {
    delete navigator.serviceWorker;
  }
  if (pushManager) {
    window.PushManager = function () {};
  } else {
    delete window.PushManager;
  }
  if (notification) {
    window.Notification = { requestPermission: vi.fn().mockResolvedValue("granted") };
  } else {
    delete window.Notification;
  }
}

describe("NotificationSettings", () => {
  beforeEach(() => {
    setSupportEnvironment({});
  });

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: ORIGINAL_USER_AGENT });
    delete navigator.serviceWorker;
    delete window.PushManager;
    delete window.Notification;
  });

  it("renders an unsupported message when the browser lacks push APIs", async () => {
    setSupportEnvironment({ pushManager: false });
    render(<NotificationSettings />);
    expect(await screen.findByText(/aren't supported in this browser/i)).toBeInTheDocument();
  });

  it("prompts iOS users to install as a PWA first", async () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    });
    render(<NotificationSettings />);
    expect(await screen.findByText(/add mochareads to your home screen/i)).toBeInTheDocument();
  });

  it("shows a 'Turn on notifications' button when supported and not subscribed", async () => {
    render(<NotificationSettings />);
    expect(await screen.findByRole("button", { name: /turn on notifications/i })).toBeInTheDocument();
  });

  it("shows a 'Turn off notifications' button when already subscribed", async () => {
    setSupportEnvironment({ subscription: { endpoint: "https://push.example.com/1" } });
    render(<NotificationSettings />);
    expect(await screen.findByRole("button", { name: /turn off notifications/i })).toBeInTheDocument();
  });

  it("enables push notifications when the button is clicked", async () => {
    const user = userEvent.setup();
    // urlBase64ToUint8Array feeds this straight into atob(); an unset (or
    // otherwise non-base64) key blows up with "InvalidCharacterError"
    // before the subscribe call is ever made.
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "AAAA");
    global.fetch.mockImplementation((url, opts) => {
      if (url === "/api/push/subscribe" && opts?.method === "POST") {
        return Promise.resolve(makeFetchResponse({ success: true }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
    render(<NotificationSettings />);

    await user.click(await screen.findByRole("button", { name: /turn on notifications/i }));

    expect(await screen.findByRole("button", { name: /turn off notifications/i })).toBeInTheDocument();
  });

  it("shows an error when permission is blocked", async () => {
    const user = userEvent.setup();
    window.Notification = { requestPermission: vi.fn().mockResolvedValue("denied") };
    render(<NotificationSettings />);

    await user.click(await screen.findByRole("button", { name: /turn on notifications/i }));

    expect(await screen.findByText(/notifications were blocked/i)).toBeInTheDocument();
  });

  it("shows an error when enabling throws (e.g. the subscribe or save request fails)", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "AAAA");
    global.fetch.mockImplementation((url, opts) => {
      if (url === "/api/push/subscribe" && opts?.method === "POST") {
        return Promise.resolve(makeFetchResponse(null, { ok: false, status: 500 }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
    render(<NotificationSettings />);

    await user.click(await screen.findByRole("button", { name: /turn on notifications/i }));

    expect(await screen.findByText(/something went wrong enabling notifications/i)).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("Failed to enable push notifications:", expect.any(Error));
    consoleError.mockRestore();
  });

  it("disables push notifications when the button is clicked while subscribed", async () => {
    const user = userEvent.setup();
    const unsubscribe = vi.fn().mockResolvedValue(true);
    setSupportEnvironment({ subscription: { endpoint: "https://push.example.com/1" } });
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription = vi.fn().mockResolvedValue({
        endpoint: "https://push.example.com/1",
        unsubscribe,
      });
    });
    global.fetch.mockImplementation((url, opts) => {
      if (url === "/api/push/unsubscribe" && opts?.method === "POST") {
        return Promise.resolve(makeFetchResponse({ success: true }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
    render(<NotificationSettings />);

    await user.click(await screen.findByRole("button", { name: /turn off notifications/i }));

    expect(await screen.findByRole("button", { name: /turn on notifications/i })).toBeInTheDocument();
    await waitFor(() => expect(unsubscribe).toHaveBeenCalled());
  });

  it("shows an error when disabling push notifications throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    setSupportEnvironment({ subscription: { endpoint: "https://push.example.com/1" } });
    global.fetch.mockImplementation((url, opts) => {
      if (url === "/api/push/unsubscribe" && opts?.method === "POST") {
        return Promise.reject(new Error("network down"));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
    render(<NotificationSettings />);

    await user.click(await screen.findByRole("button", { name: /turn off notifications/i }));

    expect(await screen.findByText(/something went wrong turning off notifications/i)).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("Failed to disable push notifications:", expect.any(Error));
    consoleError.mockRestore();
  });
});
