import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeSession, makeArticle } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockClusterArticles = vi.fn();
vi.mock("@/lib/storyClustering", () => ({
  clusterArticles: (...args) => mockClusterArticles(...args),
}));

const { GET } = await import("./route");

function articleInstance(overrides = {}) {
  const data = makeArticle(overrides);
  return { ...data, toJSON: () => data };
}

describe("GET /api/news/top-stories", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Article.findAll.mockReset();
    mockClusterArticles.mockReset();
  });

  it("builds top stories from clustered recent articles", async () => {
    mockAuth.mockResolvedValue(null);
    const a1 = articleInstance({ sourceName: "Reuters" });
    const a2 = articleInstance({ sourceName: "AP" });
    db.Article.findAll.mockResolvedValue([a1, a2]);
    mockClusterArticles.mockReturnValue([[a1, a2]]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.topStories).toHaveLength(1);
    expect(body.topStories[0].relatedCount).toBe(1);
    expect(body.topStories[0].sources).toEqual(["Reuters", "AP"]);
  });

  it("returns an empty list when no clusters form", async () => {
    mockAuth.mockResolvedValue(null);
    db.Article.findAll.mockResolvedValue([]);
    mockClusterArticles.mockReturnValue([]);

    const res = await GET();
    const body = await res.json();

    expect(body.topStories).toEqual([]);
  });

  it("works for both subscribed and non-subscribed sessions (gating happens in the query, not the response shape)", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Article.findAll.mockResolvedValue([]);
    mockClusterArticles.mockReturnValue([]);

    const res = await GET();

    expect(res.status).toBe(200);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(null);
    db.Article.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
