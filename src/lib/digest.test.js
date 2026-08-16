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

// getPersonalizedPicks/getFeedScopedArticles/getFollowedArticles order via
// src/lib/dbOrder.js's orderByDesc, which reads the bound Sequelize
// instance off the model itself — getTrendingArticles doesn't (it sorts by
// the NOT NULL clickCount column), so its own plain `{ findAll }` mocks
// above are left as-is.
function makeArticleModel(resolvedValue) {
  return {
    findAll: vi.fn().mockResolvedValue(resolvedValue),
    sequelize: { literal: vi.fn((sql) => ({ __literal: sql })) },
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
        sequelize: { literal: vi.fn((sql) => ({ __literal: sql })) },
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
    const Article = makeArticleModel([article()]);
    const result = await getFeedScopedArticles(Article, {
      sourceNames: ["TechCrunch"],
      categories: ["Tech"],
    });
    expect(result).toHaveLength(1);
    expect(Article.findAll).toHaveBeenCalled();
  });

  it("applies keyword exclusion when mutedKeywords are given", async () => {
    const Article = makeArticleModel([]);
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
    const Article = makeArticleModel([article()]);
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

  // Article fields come from third-party RSS feeds (see rss-fetch-app),
  // not from this app, so a malicious/compromised feed's title, url, or
  // sourceName must not be able to break out of this hand-built HTML
  // template into markup/attributes that land in a real subscriber's inbox.
  it("escapes a malicious article title instead of injecting raw markup", () => {
    const html = buildDigestHtml({
      trending: [article({ title: '<img src=x onerror=alert(1)>' })],
      picks: [],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes a quote-breakout attempt in an article url instead of breaking out of the href attribute", () => {
    const html = buildDigestHtml({
      trending: [
        article({ url: 'http://evil.example/x?a=1" onmouseover="alert(1)' }),
      ],
      picks: [],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain('onmouseover="alert(1)"');
    expect(html).toContain("&quot;");
  });

  it("renders a non-http(s) article url as plain text instead of a clickable link", () => {
    const html = buildDigestHtml({
      trending: [article({ title: "Suspicious", url: "javascript:alert(1)" })],
      picks: [],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain('href="javascript:alert(1)"');
    expect(html).toContain("Suspicious");
  });

  it("drops a non-http(s) urlToImage instead of rendering it as an <img> src", () => {
    const html = buildDigestHtml({
      trending: [article({ urlToImage: "javascript:alert(1)" })],
      picks: [],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain('src="javascript:alert(1)"');
  });

  it("escapes a malicious feed title in the feed-scoped section heading", () => {
    const html = buildDigestHtml({
      feedTitle: '"><script>alert(1)</script>',
      feedArticles: [article()],
      trending: [],
      picks: [],
      frequency: "daily",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
