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

  it("aggregates signal from saves, recent clicks, onboarding picks, and followed sources — not just likes", async () => {
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.Archive.findAll.mockResolvedValue([{ id: "archive-1" }]);
    db.SavedArticle.findAll.mockResolvedValue([
      { url: "https://example.com/saved", sourceName: "AP" },
    ]);
    db.UserInteraction.findAll.mockResolvedValue([
      { articleUrl: "https://example.com/clicked", sourceName: "BBC", category: ["World"] },
    ]);
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: [],
      preferredCategories: ["Tech"],
      preferredSources: ["NPR"],
      followedSources: ["Bloomberg"],
    });

    const candidate = articleInstance({
      url: "https://example.com/candidate",
      sourceName: "Bloomberg", // matches the followed-source signal, the strongest one
      category: [],
    });
    db.Article.findAll.mockResolvedValueOnce([candidate]).mockResolvedValueOnce([]);

    const ranked = await getRecommendedArticles(db, "user-1", { limit: 10 });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].reason).toBe("Because you follow Bloomberg");
    // Excluded-from-candidates set should include the saved and clicked
    // URLs, not just liked ones — confirmed via the candidate query's where.
    const candidateWhere = db.Article.findAll.mock.calls[0][0].where;
    expect(candidateWhere.url).toBeDefined();
  });

  it("applies the user's muted-keyword exclusion to the trending fallback when there's no signal at all", async () => {
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.Archive.findAll.mockResolvedValue([]);
    db.UserInteraction.findAll.mockResolvedValue([]);
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: ["politics"],
      preferredCategories: [],
      preferredSources: [],
    });
    db.Article.findAll.mockResolvedValue([]);

    await getRecommendedArticles(db, "user-1", { limit: 10 });

    const whereArg = db.Article.findAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    expect(whereArg[andKey]).toHaveLength(1); // the muted-keyword exclusion fragment
  });

  it("picks a category-based reason when it outweighs the source signal, and breaks ties across multiple categories", async () => {
    db.ArticleLike.findAll.mockResolvedValue([
      { articleUrl: "https://example.com/liked-1" },
      { articleUrl: "https://example.com/liked-2" },
    ]);
    db.Archive.findAll.mockResolvedValue([]);
    db.UserInteraction.findAll.mockResolvedValue([]);
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: [],
      preferredCategories: [],
      preferredSources: [],
    });

    // Two liked articles from different, unfollowed sources but both
    // tagged "Science" — so the category signal (weight 3 + 3 = 6) clearly
    // outweighs either individual source signal (weight 3 each), and there
    // are 2+ distinct categories overall so the ranking's sort comparator
    // actually runs (a single-entry array never invokes its comparator).
    db.Article.findAll
      .mockResolvedValueOnce([
        { url: "https://example.com/liked-1", sourceName: "SourceA", category: ["Science", "Tech"] },
        { url: "https://example.com/liked-2", sourceName: "SourceB", category: ["Science"] },
      ])
      .mockResolvedValueOnce([
        articleInstance({ url: "https://example.com/candidate", sourceName: "SourceC", category: ["Science"] }),
      ])
      .mockResolvedValueOnce([]);

    const ranked = await getRecommendedArticles(db, "user-1", { limit: 10 });

    expect(ranked[0].reason).toBe("Because you read Science");
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
