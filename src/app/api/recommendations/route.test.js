import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeSession, makeArticle } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function articleInstance(overrides = {}) {
  const data = makeArticle(overrides);
  return { ...data, toJSON: () => data };
}

describe("GET /api/recommendations", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Article.findAll.mockReset();
    db.ArticleLike.findAll.mockReset();
    db.Archive.findAll.mockReset();
    db.UserInteraction.findAll.mockReset();
    db.SavedArticle.findAll.mockReset();
    db.User.findByPk.mockReset();
    db.ReadArticle.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await GET();

    expect(res.status).toBe(403);
  });

  it("falls back to trending when the user has no engagement signal yet", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.Archive.findAll.mockResolvedValue([]);
    db.UserInteraction.findAll.mockResolvedValue([]);
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: [],
      preferredCategories: [],
      preferredSources: [],
    });
    const trendingArticle = articleInstance({ url: "https://example.com/trending" });
    db.Article.findAll.mockResolvedValue([trendingArticle]);
    db.ReadArticle.findAll.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toHaveLength(1);
    expect(body.articles[0].recommendationReason).toBeNull();
    expect(body.articles[0].isLikedByUser).toBe(false);
  });

  it("ranks candidates by source/category affinity and attaches a reason", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.ArticleLike.findAll.mockResolvedValue([{ articleUrl: "https://example.com/liked" }]);
    db.Archive.findAll.mockResolvedValue([]);
    db.UserInteraction.findAll.mockResolvedValue([]);
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: [],
      preferredCategories: [],
      preferredSources: [],
    });

    const candidate = articleInstance({
      url: "https://example.com/candidate",
      sourceName: "Reuters",
      category: ["Business"],
    });

    db.Article.findAll
      .mockResolvedValueOnce([
        { url: "https://example.com/liked", sourceName: "Reuters", category: ["Business"] },
      ]) // likedArticles lookup
      .mockResolvedValueOnce([candidate]) // ranked candidates
      .mockResolvedValueOnce([]); // backfill trending (candidate pool is under MIN_RESULTS_BEFORE_BACKFILL)

    db.ReadArticle.findAll.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toHaveLength(1);
    expect(body.articles[0].recommendationReason).toBe("Because you follow Reuters");
  });

  it("weights a followed source above likes/saves/onboarding picks when choosing the reason", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    // A like on a different source, so the followed source has to outweigh
    // it to win the "Because you..." reason below.
    db.ArticleLike.findAll.mockResolvedValue([{ articleUrl: "https://example.com/liked" }]);
    db.Archive.findAll.mockResolvedValue([]);
    db.UserInteraction.findAll.mockResolvedValue([]);
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: [],
      preferredCategories: [],
      preferredSources: [],
      followedSources: ["Reuters"],
    });

    const candidate = articleInstance({
      url: "https://example.com/candidate",
      sourceName: "Reuters",
      category: ["Business"],
    });

    db.Article.findAll
      .mockResolvedValueOnce([
        { url: "https://example.com/liked", sourceName: "AP", category: ["Business"] },
      ]) // likedArticles lookup
      .mockResolvedValueOnce([candidate]) // ranked candidates
      .mockResolvedValueOnce([]); // backfill trending

    db.ReadArticle.findAll.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles[0].recommendationReason).toBe("Because you follow Reuters");
  });

  it("marks liked/read articles based on the user's own history", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.Archive.findAll.mockResolvedValue([]);
    db.UserInteraction.findAll.mockResolvedValue([]);
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: [],
      preferredCategories: [],
      preferredSources: [],
    });
    const trendingArticle = articleInstance({ url: "https://example.com/read-me" });
    db.Article.findAll.mockResolvedValue([trendingArticle]);
    db.ReadArticle.findAll.mockResolvedValue([{ articleUrl: "https://example.com/read-me" }]);

    const res = await GET();
    const body = await res.json();

    expect(body.articles[0].isRead).toBe(true);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.ArticleLike.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
