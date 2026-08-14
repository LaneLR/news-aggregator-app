import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSession } from "@/test/fixtures";

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetCategoryArticles = vi.fn();
vi.mock("@/lib/categoryArticles", () => ({
  getCategoryArticles: (...args) => mockGetCategoryArticles(...args),
}));

const { GET } = await import("./route");

function makeRequest(url) {
  return new NextRequest(url);
}

describe("GET /api/articles/[category]", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetCategoryArticles.mockReset();
  });

  it("blocks anonymous visitors from a gated category", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/articles/market"), {
      params: Promise.resolve({ category: "market" }),
    });

    expect(res.status).toBe(403);
    expect(mockGetCategoryArticles).not.toHaveBeenCalled();
  });

  it("blocks Free-tier users from a gated category", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await GET(makeRequest("http://localhost/api/articles/market"), {
      params: Promise.resolve({ category: "market" }),
    });

    expect(res.status).toBe(403);
  });

  it("allows Free-tier users into Finance — it's no longer fully gated", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    mockGetCategoryArticles.mockResolvedValue({ articles: [] });

    const res = await GET(makeRequest("http://localhost/api/articles/finance"), {
      params: Promise.resolve({ category: "finance" }),
    });

    expect(res.status).toBe(200);
    expect(mockGetCategoryArticles).toHaveBeenCalledWith(
      expect.objectContaining({ category: "finance", isSubscribed: false })
    );
  });

  it("allows Subscribed users into a gated category", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    mockGetCategoryArticles.mockResolvedValue({ articles: [] });

    const res = await GET(makeRequest("http://localhost/api/articles/journal"), {
      params: Promise.resolve({ category: "journal" }),
    });

    expect(res.status).toBe(200);
  });

  it("allows anonymous visitors into a non-gated category on the default latest/page-1 view", async () => {
    mockAuth.mockResolvedValue(null);
    mockGetCategoryArticles.mockResolvedValue({ articles: [] });

    const res = await GET(makeRequest("http://localhost/api/articles/business"), {
      params: Promise.resolve({ category: "business" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toEqual([]);
    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "business",
      sort: "latest",
      userId: undefined,
      page: 1,
      isSubscribed: false,
    });
  });

  it("blocks anonymous visitors from Trending/Most Liked sorts", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/articles/business?sort=liked"), {
      params: Promise.resolve({ category: "business" }),
    });

    expect(res.status).toBe(401);
    expect(mockGetCategoryArticles).not.toHaveBeenCalled();
  });

  it("blocks anonymous visitors from paging past the teaser", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/articles/business?page=2"), {
      params: Promise.resolve({ category: "business" }),
    });

    expect(res.status).toBe(401);
    expect(mockGetCategoryArticles).not.toHaveBeenCalled();
  });

  it("allows a signed-in user to request Trending sort and page 2", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    mockGetCategoryArticles.mockResolvedValue({ articles: [] });

    const res = await GET(makeRequest("http://localhost/api/articles/business?page=2&sort=liked"), {
      params: Promise.resolve({ category: "business" }),
    });

    expect(res.status).toBe(200);
    expect(mockGetCategoryArticles).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "liked", page: 2 })
    );
  });

  it("returns 500 when the data layer throws", async () => {
    mockAuth.mockResolvedValue(null);
    mockGetCategoryArticles.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest("http://localhost/api/articles/business"), {
      params: Promise.resolve({ category: "business" }),
    });

    expect(res.status).toBe(500);
  });
});
