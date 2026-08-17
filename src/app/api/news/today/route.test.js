import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSession } from "@/test/fixtures";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetTodayArticles = vi.fn();
vi.mock("@/lib/todayArticles", () => ({
  getTodayArticles: (...args) => mockGetTodayArticles(...args),
}));

const { GET } = await import("./route");

function makeRequest(url) {
  return new NextRequest(url);
}

describe("GET /api/news/today", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetTodayArticles.mockReset();
  });

  it("rejects anonymous visitors — Today has no teaser mode", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/news/today?startOfDay=2026-08-17T00:00:00.000Z"));

    expect(res.status).toBe(401);
    expect(mockGetTodayArticles).not.toHaveBeenCalled();
  });

  it("rejects a request missing startOfDay", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await GET(makeRequest("http://localhost/api/news/today"));

    expect(res.status).toBe(400);
    expect(mockGetTodayArticles).not.toHaveBeenCalled();
  });

  it("fetches a newest-sorted preview for a signed-in user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));
    mockGetTodayArticles.mockResolvedValue({ articles: [{ url: "a1" }], total: 1, page: 1, totalPages: 1 });

    const res = await GET(makeRequest("http://localhost/api/news/today?startOfDay=2026-08-17T00:00:00.000Z"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toEqual([{ url: "a1" }]);
    expect(mockGetTodayArticles).toHaveBeenCalledWith({
      startOfDay: "2026-08-17T00:00:00.000Z",
      sort: "newest",
      userId: "user-1",
      page: 1,
      limit: 12,
      isSubscribed: true,
    });
  });

  it("passes isSubscribed: false for a Free-tier user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Free" }));
    mockGetTodayArticles.mockResolvedValue({ articles: [] });

    await GET(makeRequest("http://localhost/api/news/today?startOfDay=2026-08-17T00:00:00.000Z"));

    expect(mockGetTodayArticles).toHaveBeenCalledWith(
      expect.objectContaining({ isSubscribed: false })
    );
  });

  it("returns 500 when the data layer throws", async () => {
    mockAuth.mockResolvedValue(makeSession());
    mockGetTodayArticles.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest("http://localhost/api/news/today?startOfDay=2026-08-17T00:00:00.000Z"));

    expect(res.status).toBe(500);
  });
});
