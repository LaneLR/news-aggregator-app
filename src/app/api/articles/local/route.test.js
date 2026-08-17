import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSession } from "@/test/fixtures";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetLocalArticles = vi.fn();
vi.mock("@/lib/localArticles", () => ({
  getLocalArticles: (...args) => mockGetLocalArticles(...args),
}));

const { GET } = await import("./route");

const DFW = "lat=32.85&lon=-97.05";

function makeRequest(url) {
  return new NextRequest(url);
}

describe("GET /api/articles/local", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetLocalArticles.mockReset();
  });

  it("rejects anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest(`http://localhost/api/articles/local?${DFW}`));

    expect(res.status).toBe(401);
    expect(mockGetLocalArticles).not.toHaveBeenCalled();
  });

  it("rejects a request with no resolvable location", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await GET(makeRequest("http://localhost/api/articles/local"));

    expect(res.status).toBe(400);
    expect(mockGetLocalArticles).not.toHaveBeenCalled();
  });

  it("defaults to sort=newest and page=1", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Free" }));
    mockGetLocalArticles.mockResolvedValue({ articles: [] });

    await GET(makeRequest(`http://localhost/api/articles/local?${DFW}`));

    expect(mockGetLocalArticles).toHaveBeenCalledWith({
      hubCityId: "dallas-fort-worth",
      sort: "newest",
      userId: "user-1",
      page: 1,
      isSubscribed: false,
    });
  });

  it("passes through an explicit sort and page", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));
    mockGetLocalArticles.mockResolvedValue({ articles: [] });

    await GET(makeRequest(`http://localhost/api/articles/local?${DFW}&sort=trending&page=3`));

    expect(mockGetLocalArticles).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "trending", page: 3, isSubscribed: true })
    );
  });

  it("returns the data layer's response body plus the resolved hub city", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const payload = { articles: [{ url: "a1" }], total: 1, page: 1, totalPages: 1 };
    mockGetLocalArticles.mockResolvedValue(payload);

    const res = await GET(makeRequest(`http://localhost/api/articles/local?${DFW}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toEqual(payload.articles);
    expect(body.hubCity.id).toBe("dallas-fort-worth");
  });

  it("returns 500 when the data layer throws", async () => {
    mockAuth.mockResolvedValue(makeSession());
    mockGetLocalArticles.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest(`http://localhost/api/articles/local?${DFW}`));

    expect(res.status).toBe(500);
  });
});
