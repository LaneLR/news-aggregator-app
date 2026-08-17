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

describe("GET /api/articles/today", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetTodayArticles.mockReset();
  });

  it("rejects anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/articles/today?startOfDay=2026-08-17T00:00:00.000Z"));

    expect(res.status).toBe(401);
    expect(mockGetTodayArticles).not.toHaveBeenCalled();
  });

  it("rejects a request missing startOfDay", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await GET(makeRequest("http://localhost/api/articles/today"));

    expect(res.status).toBe(400);
    expect(mockGetTodayArticles).not.toHaveBeenCalled();
  });

  it("defaults to sort=newest and page=1", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Free" }));
    mockGetTodayArticles.mockResolvedValue({ articles: [] });

    await GET(makeRequest("http://localhost/api/articles/today?startOfDay=2026-08-17T00:00:00.000Z"));

    expect(mockGetTodayArticles).toHaveBeenCalledWith({
      startOfDay: "2026-08-17T00:00:00.000Z",
      sort: "newest",
      userId: "user-1",
      page: 1,
      isSubscribed: false,
    });
  });

  it("passes through an explicit sort and page", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));
    mockGetTodayArticles.mockResolvedValue({ articles: [] });

    await GET(
      makeRequest("http://localhost/api/articles/today?startOfDay=2026-08-17T00:00:00.000Z&sort=trending&page=3")
    );

    expect(mockGetTodayArticles).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "trending", page: 3, isSubscribed: true })
    );
  });

  it("returns the data layer's response body as-is", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const payload = { articles: [{ url: "a1" }], total: 1, page: 1, totalPages: 1 };
    mockGetTodayArticles.mockResolvedValue(payload);

    const res = await GET(makeRequest("http://localhost/api/articles/today?startOfDay=2026-08-17T00:00:00.000Z"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(payload);
  });

  it("returns 500 when the data layer throws", async () => {
    mockAuth.mockResolvedValue(makeSession());
    mockGetTodayArticles.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest("http://localhost/api/articles/today?startOfDay=2026-08-17T00:00:00.000Z"));

    expect(res.status).toBe(500);
  });
});
