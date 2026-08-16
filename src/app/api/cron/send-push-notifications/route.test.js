import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockGetFollowedArticles = vi.fn();
vi.mock("@/lib/digest", () => ({
  getFollowedArticles: (...args) => mockGetFollowedArticles(...args),
}));

const mockSendPushToUser = vi.fn();
vi.mock("@/lib/webPush", () => ({ sendPushToUser: (...args) => mockSendPushToUser(...args) }));

const { GET, POST } = await import("./route");

function makeRequest(authHeader) {
  return new NextRequest("http://localhost/api/cron/send-push-notifications", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("GET,POST /api/cron/send-push-notifications", () => {
  beforeEach(() => {
    mockGetFollowedArticles.mockReset().mockResolvedValue([]);
    mockSendPushToUser.mockReset();
    db.PushSubscription.findAll.mockReset();
    db.User.findAll.mockReset();
  });

  it("rejects requests missing the CRON_SECRET bearer header", async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
  });

  it("rejects requests with the wrong secret", async () => {
    const res = await POST(makeRequest("Bearer wrong"));

    expect(res.status).toBe(401);
  });

  it("fails closed when CRON_SECRET itself isn't configured", async () => {
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await GET(makeRequest("Bearer undefined"));
      expect(res.status).toBe(401);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("CRON_SECRET is not set"));
    } finally {
      process.env.CRON_SECRET = original;
    }
  });

  it("does not re-notify a user whose last push was under 20 hours ago", async () => {
    db.PushSubscription.findAll.mockResolvedValue([{ userId: "user-1" }]);
    const user = createInstanceMock({
      id: "user-1",
      followedKeywords: ["nvidia"],
      lastPushSentAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    });
    db.User.findAll.mockResolvedValue([user]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(body.eligible).toBe(0);
    expect(mockSendPushToUser).not.toHaveBeenCalled();
  });

  it("re-notifies a user once 20+ hours have passed since their last push", async () => {
    db.PushSubscription.findAll.mockResolvedValue([{ userId: "user-1" }]);
    const user = createInstanceMock({
      id: "user-1",
      followedKeywords: ["nvidia"],
      lastPushSentAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
    });
    db.User.findAll.mockResolvedValue([user]);
    mockGetFollowedArticles.mockResolvedValue([{ title: "Match" }]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(body.eligible).toBe(1);
    expect(mockSendPushToUser).toHaveBeenCalled();
  });

  it("short-circuits with eligible:0 when nobody has a push subscription", async () => {
    db.PushSubscription.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: "ok", eligible: 0, sent: 0 });
    expect(db.User.findAll).not.toHaveBeenCalled();
  });

  it("sends a push notification for a subscribed, due user with matches", async () => {
    db.PushSubscription.findAll.mockResolvedValue([{ userId: "user-1" }]);
    const user = createInstanceMock({
      id: "user-1",
      email: "a@b.com",
      tier: "Subscribed",
      followedKeywords: ["nvidia"],
      lastPushSentAt: null,
    });
    db.User.findAll.mockResolvedValue([user]);
    mockGetFollowedArticles.mockResolvedValue([{ title: "Match" }]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
    expect(mockSendPushToUser).toHaveBeenCalledWith(
      db.PushSubscription,
      "user-1",
      expect.objectContaining({ title: expect.any(String) })
    );
    expect(user.update).toHaveBeenCalledWith({ lastPushSentAt: expect.any(Date) });
  });

  it("skips users who don't follow any keywords", async () => {
    db.PushSubscription.findAll.mockResolvedValue([{ userId: "user-1" }]);
    const user = createInstanceMock({
      id: "user-1",
      followedKeywords: [],
      lastPushSentAt: null,
    });
    db.User.findAll.mockResolvedValue([user]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(body.eligible).toBe(0);
    expect(mockSendPushToUser).not.toHaveBeenCalled();
  });

  it("counts a per-user failure without aborting the rest of the batch", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    db.PushSubscription.findAll.mockResolvedValue([{ userId: "user-1" }, { userId: "user-2" }]);
    const failingUser = createInstanceMock({
      id: "user-1",
      email: "fails@b.com",
      followedKeywords: ["nvidia"],
      lastPushSentAt: null,
    });
    const okUser = createInstanceMock({
      id: "user-2",
      email: "ok@b.com",
      followedKeywords: ["tesla"],
      lastPushSentAt: null,
    });
    db.User.findAll.mockResolvedValue([failingUser, okUser]);
    mockGetFollowedArticles
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValueOnce([]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
    expect(body.failed).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to send push notification to fails@b.com"),
      expect.any(Error)
    );
    expect(failingUser.update).not.toHaveBeenCalled();
    expect(okUser.update).toHaveBeenCalledWith({ lastPushSentAt: expect.any(Date) });
  });

  it("returns 500 when the job throws unexpectedly", async () => {
    db.PushSubscription.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));

    expect(res.status).toBe(500);
  });
});
