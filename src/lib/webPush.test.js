import { describe, expect, it, vi, beforeEach } from "vitest";
import { createInstanceMock } from "@/test/dbMock";

const { setVapidDetails, sendNotification } = vi.hoisted(() => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock("web-push", () => ({
  default: { setVapidDetails, sendNotification },
}));

function makeSubscription(overrides = {}) {
  return createInstanceMock({
    id: "sub-1",
    userId: "user-1",
    endpoint: "https://push.example.com/abc",
    p256dh: "p256dh-key",
    auth: "auth-key",
    ...overrides,
  });
}

describe("sendPushToUser", () => {
  beforeEach(() => {
    vi.resetModules();
    setVapidDetails.mockClear();
    sendNotification.mockClear();
  });

  it("skips sending and reports not_configured when VAPID keys are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "");
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    const { sendPushToUser } = await import("./webPush");
    const PushSubscription = { findAll: vi.fn() };

    const result = await sendPushToUser(PushSubscription, "user-1", { title: "hi" });

    expect(result).toEqual({ sent: 0, skipped: "not_configured" });
    expect(PushSubscription.findAll).not.toHaveBeenCalled();
  });

  it("returns sent: 0 when the user has no subscriptions", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    const { sendPushToUser } = await import("./webPush");
    const PushSubscription = { findAll: vi.fn().mockResolvedValue([]) };

    const result = await sendPushToUser(PushSubscription, "user-1", { title: "hi" });
    expect(result).toEqual({ sent: 0 });
  });

  it("sends a notification to each subscription and configures VAPID once", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    vi.stubEnv("CONTACT_EMAIL", "hello@example.com");
    const { sendPushToUser } = await import("./webPush");

    const subs = [makeSubscription({ id: "sub-1" }), makeSubscription({ id: "sub-2" })];
    const PushSubscription = { findAll: vi.fn().mockResolvedValue(subs) };
    sendNotification.mockResolvedValue();

    const result = await sendPushToUser(PushSubscription, "user-1", { title: "New article" });

    expect(setVapidDetails).toHaveBeenCalledWith(
      "mailto:hello@example.com",
      "pub",
      "priv"
    );
    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ sent: 2 });
  });

  it("prunes a subscription that has been unregistered (404/410) instead of counting it as sent", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    const { sendPushToUser } = await import("./webPush");

    const staleSub = makeSubscription({ id: "sub-stale" });
    const PushSubscription = { findAll: vi.fn().mockResolvedValue([staleSub]) };
    const err = new Error("gone");
    err.statusCode = 410;
    sendNotification.mockRejectedValueOnce(err);

    const result = await sendPushToUser(PushSubscription, "user-1", { title: "hi" });

    expect(staleSub.destroy).toHaveBeenCalled();
    expect(result).toEqual({ sent: 0 });
  });

  it("does not prune and just logs on a non-410/404 send failure", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "pub");
    vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
    const { sendPushToUser } = await import("./webPush");

    const sub = makeSubscription({ id: "sub-err" });
    const PushSubscription = { findAll: vi.fn().mockResolvedValue([sub]) };
    const err = new Error("server error");
    err.statusCode = 500;
    sendNotification.mockRejectedValueOnce(err);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendPushToUser(PushSubscription, "user-1", { title: "hi" });

    expect(sub.destroy).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0 });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
