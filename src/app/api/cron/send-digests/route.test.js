import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockSendEmail = vi.fn();
vi.mock("@/utils/emailer", () => ({ sendEmail: (...args) => mockSendEmail(...args) }));

const mockGetTrendingArticles = vi.fn();
const mockGetFeedScopedArticles = vi.fn();
const mockGetDigestArticles = vi.fn();
const mockBuildDigestHtml = vi.fn();
vi.mock("@/lib/digest", () => ({
  getTrendingArticles: (...args) => mockGetTrendingArticles(...args),
  getFeedScopedArticles: (...args) => mockGetFeedScopedArticles(...args),
  getDigestArticles: (...args) => mockGetDigestArticles(...args),
  buildDigestHtml: (...args) => mockBuildDigestHtml(...args),
}));

const { GET, POST } = await import("./route");

function makeRequest(authHeader) {
  return new NextRequest("http://localhost/api/cron/send-digests", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("GET,POST /api/cron/send-digests", () => {
  beforeEach(() => {
    mockSendEmail.mockReset();
    mockGetTrendingArticles.mockReset().mockResolvedValue([]);
    mockGetFeedScopedArticles.mockReset().mockResolvedValue([]);
    mockGetDigestArticles.mockReset().mockResolvedValue([]);
    mockBuildDigestHtml.mockReset().mockReturnValue("<html></html>");
    db.User.findAll.mockReset();
    db.Feed.findOne.mockReset();
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

  it.each([
    { frequency: "daily", hoursAgo: 10, expectDue: false },
    { frequency: "daily", hoursAgo: 21, expectDue: true },
    { frequency: "weekly", hoursAgo: 24, expectDue: false },
    { frequency: "weekly", hoursAgo: 7 * 24 + 1, expectDue: true },
  ])(
    "only treats a $frequency user as due after enough time has passed (expectDue=$expectDue)",
    async ({ frequency, hoursAgo, expectDue }) => {
      const user = createInstanceMock({
        id: "user-1",
        email: "a@b.com",
        tier: "Free",
        digestFrequency: frequency,
        digestFeedId: null,
        lastDigestSentAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
      });
      db.User.findAll.mockResolvedValue([user]);
      mockGetDigestArticles.mockResolvedValue([{ article: { id: 1 }, reason: null }]);

      const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
      const body = await res.json();

      expect(body.eligible).toBe(expectDue ? 1 : 0);
      expect(mockSendEmail).toHaveBeenCalledTimes(expectDue ? 1 : 0);
    }
  );

  it("skips users with nothing to send but still marks them processed", async () => {
    const user = createInstanceMock({
      id: "user-1",
      email: "a@b.com",
      tier: "Free",
      digestFrequency: "weekly",
      lastDigestSentAt: null,
    });
    db.User.findAll.mockResolvedValue([user]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(0);
    expect(user.update).toHaveBeenCalledWith({ lastDigestSentAt: expect.any(Date) });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sends a digest email when there's content and marks the user processed", async () => {
    const user = createInstanceMock({
      id: "user-1",
      email: "a@b.com",
      tier: "Subscribed",
      digestFrequency: "daily",
      digestFeedId: null,
      lastDigestSentAt: null,
    });
    db.User.findAll.mockResolvedValue([user]);
    mockGetDigestArticles.mockResolvedValue([{ article: { id: 1, title: "Pick" }, reason: null }]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.com" })
    );
  });

  it("caps a general (non-feed-scoped) digest at 5 articles via getDigestArticles", async () => {
    const user = createInstanceMock({
      id: "user-1",
      email: "a@b.com",
      tier: "Free",
      digestFrequency: "weekly",
      digestFeedId: null,
      lastDigestSentAt: null,
    });
    db.User.findAll.mockResolvedValue([user]);
    mockGetDigestArticles.mockResolvedValue([{ article: { id: 1 }, reason: null }]);

    await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));

    expect(mockGetDigestArticles).toHaveBeenCalledWith(
      db,
      user,
      expect.objectContaining({ isSubscribed: false, limit: 5 })
    );
  });

  it("uses a subscriber's chosen custom Feed instead of getDigestArticles, capped at 5", async () => {
    const user = createInstanceMock({
      id: "user-1",
      email: "a@b.com",
      tier: "Subscribed",
      digestFrequency: "weekly",
      digestFeedId: "feed-1",
      lastDigestSentAt: null,
    });
    db.User.findAll.mockResolvedValue([user]);
    db.Feed.findOne.mockResolvedValue({ id: "feed-1", title: "My Feed" });
    mockGetFeedScopedArticles.mockResolvedValue([{ id: 1, title: "Feed pick" }]);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
    expect(mockGetFeedScopedArticles).toHaveBeenCalledWith(
      db.Article,
      { id: "feed-1", title: "My Feed" },
      expect.objectContaining({ limit: 5 })
    );
    expect(mockGetDigestArticles).not.toHaveBeenCalled();
    expect(mockBuildDigestHtml).toHaveBeenCalledWith(
      expect.objectContaining({ feedTitle: "My Feed" })
    );
  });

  it("counts a per-user failure without aborting the rest of the batch", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const failingUser = createInstanceMock({
      id: "user-1",
      email: "fails@b.com",
      tier: "Free",
      digestFrequency: "weekly",
      digestFeedId: null,
      lastDigestSentAt: null,
    });
    const okUser = createInstanceMock({
      id: "user-2",
      email: "ok@b.com",
      tier: "Free",
      digestFrequency: "weekly",
      digestFeedId: null,
      lastDigestSentAt: null,
    });
    db.User.findAll.mockResolvedValue([failingUser, okUser]);
    mockGetDigestArticles.mockResolvedValue([{ article: { id: 1 }, reason: null }]);
    mockSendEmail
      .mockRejectedValueOnce(new Error("resend down"))
      .mockResolvedValueOnce(undefined);

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
    expect(body.failed).toBe(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to send digest to fails@b.com"),
      expect.any(Error)
    );
    // The failing user's lastDigestSentAt is NOT bumped (still eligible to
    // retry next run), the successful one's is.
    expect(failingUser.update).not.toHaveBeenCalled();
    expect(okUser.update).toHaveBeenCalledWith({ lastDigestSentAt: expect.any(Date) });
  });

  it("returns 500 when the job throws unexpectedly", async () => {
    db.User.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest(`Bearer ${process.env.CRON_SECRET}`));

    expect(res.status).toBe(500);
  });
});
