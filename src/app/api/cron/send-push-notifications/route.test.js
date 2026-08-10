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

  it("returns 500 when the job throws unexpectedly", async () => {
    db.PushSubscription.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));

    expect(res.status).toBe(500);
  });
});
