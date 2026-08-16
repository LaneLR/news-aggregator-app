import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeArticle } from "@/test/fixtures";

const db = createDbMock();

function articleInstance(overrides = {}) {
  const data = makeArticle(overrides);
  return { ...data, toJSON: () => data };
}

const { getRecommendedArticles } = await import("./recommendations");

describe("getRecommendedArticles", () => {
  beforeEach(() => {
    db.Article.findAll.mockReset();
    db.ArticleLike.findAll.mockReset();
    db.Archive.findAll.mockReset();
    db.UserInteraction.findAll.mockReset();
    db.SavedArticle.findAll.mockReset();
    db.User.findByPk.mockReset();
  });

  it("falls back to trending when the user has no engagement signal yet", async () => {
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

    const ranked = await getRecommendedArticles(db, "user-1", { limit: 10 });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].reason).toBeNull();
    expect(ranked[0].article).toBe(trendingArticle);
  });

  it("ranks candidates by source/category affinity and attaches a reason", async () => {
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
      .mockResolvedValueOnce([]); // backfill trending

    const ranked = await getRecommendedArticles(db, "user-1", { limit: 40 });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].reason).toBe("Because you follow Reuters");
  });

  it("caps results at the requested limit, backfilling from trending when short", async () => {
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
    const backfillArticle = articleInstance({ url: "https://example.com/backfill" });

    db.Article.findAll
      .mockResolvedValueOnce([
        { url: "https://example.com/liked", sourceName: "Reuters", category: ["Business"] },
      ]) // likedArticles lookup
      .mockResolvedValueOnce([candidate]) // ranked candidates (only 1, short of a 5-item limit)
      .mockResolvedValueOnce([backfillArticle]); // backfill trending

    const ranked = await getRecommendedArticles(db, "user-1", { limit: 5 });

    expect(ranked).toHaveLength(2);
    expect(ranked[1].article).toBe(backfillArticle);
    expect(ranked[1].reason).toBeNull();
  });
});
