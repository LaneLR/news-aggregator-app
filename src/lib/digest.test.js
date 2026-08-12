import { describe, expect, it, vi } from "vitest";
import {
  getTrendingArticles,
  getPersonalizedPicks,
  getFeedScopedArticles,
  getFollowedArticles,
  buildDigestHtml,
} from "./digest";

function article(overrides = {}) {
  return {
    title: "Headline",
    url: "https://example.com/a",
    sourceName: "Example",
    urlToImage: null,
    ...overrides,
  };
}

describe("getTrendingArticles", () => {
  it("queries for recent, clicked articles ordered by clickCount", async () => {
    const Article = { findAll: vi.fn().mockResolvedValue([article()]) };
    const result = await getTrendingArticles(Article, { isSubscribed: true, mutedKeywords: [] });
    expect(result).toHaveLength(1);
    expect(Article.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [["clickCount", "DESC"]] })
    );
  });

  it("applies gating exclusion for non-subscribers", async () => {
    const Article = { findAll: vi.fn().mockResolvedValue([]) };
    await getTrendingArticles(Article, { isSubscribed: false, mutedKeywords: [] });
    const whereArg = Article.findAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    // date, clickCount, gated-category literal, premium-tier literal
    expect(whereArg[andKey].length).toBe(4);
  });
});

describe("getPersonalizedPicks", () => {
  it("returns an empty array when the user has no like/save history", async () => {
    const db = {
      ArticleLike: { findAll: vi.fn().mockResolvedValue([]) },
      SavedArticle: { findAll: vi.fn().mockResolvedValue([]) },
      Archive: {},
      Article: { findAll: vi.fn() },
    };
    const result = await getPersonalizedPicks(db, { id: "u1", mutedKeywords: [] });
    expect(result).toEqual([]);
    expect(db.Article.findAll).not.toHaveBeenCalled();
  });

  it("derives top categories from liked/saved article history and queries similar unseen articles", async () => {
    const db = {
      ArticleLike: { findAll: vi.fn().mockResolvedValue([{ articleUrl: "u1" }]) },
      SavedArticle: { findAll: vi.fn().mockResolvedValue([{ url: "u2" }]) },
      Archive: {},
      Article: {
        findAll: vi
          .fn()
          .mockResolvedValueOnce([{ category: ["Business"] }, { category: ["Business"] }, { category: ["Tech"] }])
          .mockResolvedValueOnce([article()]),
      },
    };

    const result = await getPersonalizedPicks(db, { id: "u1", mutedKeywords: [] }, { isSubscribed: true });
    expect(result).toHaveLength(1);
    // Second findAll call is the "similar articles" query.
    const secondCallWhere = db.Article.findAll.mock.calls[1][0].where;
    expect(secondCallWhere).toBeDefined();
  });

  it("returns an empty array when history articles have no categories", async () => {
    const db = {
      ArticleLike: { findAll: vi.fn().mockResolvedValue([{ articleUrl: "u1" }]) },
      SavedArticle: { findAll: vi.fn().mockResolvedValue([]) },
      Archive: {},
      Article: { findAll: vi.fn().mockResolvedValue([{ category: [] }]) },
    };
    const result = await getPersonalizedPicks(db, { id: "u1", mutedKeywords: [] });
    expect(result).toEqual([]);
  });
});

describe("getFeedScopedArticles", () => {
  it("returns an empty array when the feed has no sourceNames or categories", async () => {
    const Article = { findAll: vi.fn() };
    const result = await getFeedScopedArticles(Article, { sourceNames: [], categories: [] });
    expect(result).toEqual([]);
    expect(Article.findAll).not.toHaveBeenCalled();
  });

  it("queries by sourceNames OR categories when present", async () => {
    const Article = { findAll: vi.fn().mockResolvedValue([article()]) };
    const result = await getFeedScopedArticles(Article, {
      sourceNames: ["TechCrunch"],
      categories: ["Tech"],
    });
    expect(result).toHaveLength(1);
    expect(Article.findAll).toHaveBeenCalled();
  });

  it("applies keyword exclusion when mutedKeywords are given", async () => {
    const Article = { findAll: vi.fn().mockResolvedValue([]) };
    await getFeedScopedArticles(Article, { sourceNames: ["X"] }, { mutedKeywords: ["spam"] });
    const whereArg = Article.findAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    expect(whereArg[andKey].length).toBe(2);
  });
});

describe("getFollowedArticles", () => {
  it("returns an empty array when the user follows no keywords", async () => {
    const Article = { findAll: vi.fn() };
    const result = await getFollowedArticles(Article, { followedKeywords: [] });
    expect(result).toEqual([]);
    expect(Article.findAll).not.toHaveBeenCalled();
  });

  it("queries recent articles matching followed keywords", async () => {
    const Article = { findAll: vi.fn().mockResolvedValue([article()]) };
    const result = await getFollowedArticles(Article, {
      followedKeywords: ["tesla"],
      isSubscribed: true,
      mutedKeywords: [],
    });
    expect(result).toHaveLength(1);
  });
});

describe("buildDigestHtml", () => {
  it("renders trending/picked sections when there's no feedTitle", () => {
    const html = buildDigestHtml({
      trending: [article({ title: "Trending story" })],
      picks: [article({ title: "Picked story" })],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
      followed: [],
    });
    expect(html).toContain("This week's MochaReads digest");
    expect(html).toContain("Trending story");
    expect(html).toContain("Picked story");
    expect(html).toContain("Picked for you");
    expect(html).toContain("Trending now");
  });

  it("renders the feed-scoped section instead when feedTitle is given", () => {
    const html = buildDigestHtml({
      feedTitle: "My Custom Feed",
      feedArticles: [article({ title: "Feed story" })],
      trending: [article({ title: "Should not appear" })],
      picks: [],
      frequency: "daily",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).toContain("Today's MochaReads digest");
    expect(html).toContain('New in "My Custom Feed"');
    expect(html).toContain("Feed story");
    expect(html).not.toContain("Should not appear");
  });

  it("renders the followed-topics section when provided", () => {
    const html = buildDigestHtml({
      trending: [],
      picks: [],
      followed: [article({ title: "Followed story" })],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).toContain("Topics you follow");
    expect(html).toContain("Followed story");
  });

  it("omits a section entirely when its article list is empty", () => {
    const html = buildDigestHtml({
      trending: [],
      picks: [],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain("Picked for you");
    expect(html).not.toContain("Trending now");
    expect(html).not.toContain("Topics you follow");
  });

  it("includes a settings link with the base URL", () => {
    const html = buildDigestHtml({
      trending: [],
      picks: [],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).toContain('href="https://morningfeeds.example/settings"');
  });
});
