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

// Real coordinates for Dallas-Fort Worth — resolveHubCity itself isn't
// mocked here (it's a cheap pure function, see its own dedicated tests),
// so these tests exercise the real lat/lon -> hub resolution end to end.
const DFW = "lat=32.85&lon=-97.05";

function makeRequest(url) {
  return new NextRequest(url);
}

describe("GET /api/news/local", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetLocalArticles.mockReset();
  });

  it("rejects anonymous visitors — Local has no teaser mode", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest(`http://localhost/api/news/local?${DFW}`));

    expect(res.status).toBe(401);
    expect(mockGetLocalArticles).not.toHaveBeenCalled();
  });

  it("rejects a request with no resolvable location", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await GET(makeRequest("http://localhost/api/news/local"));

    expect(res.status).toBe(400);
    expect(mockGetLocalArticles).not.toHaveBeenCalled();
  });

  it("resolves lat/lon to a hub city and fetches a newest-sorted preview", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));
    mockGetLocalArticles.mockResolvedValue({ articles: [{ url: "a1" }], total: 1, page: 1, totalPages: 1 });

    const res = await GET(makeRequest(`http://localhost/api/news/local?${DFW}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toEqual([{ url: "a1" }]);
    expect(body.hubCity.id).toBe("dallas-fort-worth");
    expect(mockGetLocalArticles).toHaveBeenCalledWith({
      hubCityId: "dallas-fort-worth",
      sort: "newest",
      userId: "user-1",
      page: 1,
      limit: 12,
      isSubscribed: true,
    });
  });

  it("passes isSubscribed: false for a Free-tier user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Free" }));
    mockGetLocalArticles.mockResolvedValue({ articles: [] });

    await GET(makeRequest(`http://localhost/api/news/local?${DFW}`));

    expect(mockGetLocalArticles).toHaveBeenCalledWith(
      expect.objectContaining({ isSubscribed: false })
    );
  });

  it("returns 500 when the data layer throws", async () => {
    mockAuth.mockResolvedValue(makeSession());
    mockGetLocalArticles.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest(`http://localhost/api/news/local?${DFW}`));

    expect(res.status).toBe(500);
  });
});
