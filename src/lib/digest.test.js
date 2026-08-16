import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTrendingArticles,
  getFeedScopedArticles,
  getFollowedArticles,
  getDigestArticles,
  buildDigestHtml,
} from "./digest";

vi.mock("./recommendations", () => ({
  getRecommendedArticles: vi.fn(),
}));
const { getRecommendedArticles } = await import("./recommendations");

function article(overrides = {}) {
  return {
    id: 1,
    title: "Headline",
    url: "https://example.com/a",
    sourceName: "Example",
    urlToImage: null,
    ...overrides,
  };
}

// getFeedScopedArticles/getFollowedArticles order via src/lib/dbOrder.js's
// orderByDesc, which reads the bound Sequelize instance off the model
// itself — getTrendingArticles doesn't (it sorts by the NOT NULL
// clickCount column), so its own plain `{ findAll }` mocks above are
// left as-is.
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

describe("getDigestArticles", () => {
  beforeEach(() => {
    getRecommendedArticles.mockReset();
  });

  it("routes Subscribed users through the real recommendation ranking, capped at the limit", async () => {
    const ranked = [
      { article: article({ id: 1 }), reason: "Because you follow Reuters" },
      { article: article({ id: 2 }), reason: null },
      { article: article({ id: 3 }), reason: null },
    ];
    getRecommendedArticles.mockResolvedValue(ranked);

    const db = { Article: { findAll: vi.fn() } };
    const user = { id: "u1", mutedKeywords: [] };
    const result = await getDigestArticles(db, user, { isSubscribed: true, limit: 2 });

    expect(getRecommendedArticles).toHaveBeenCalledWith(db, "u1", { limit: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].reason).toBe("Because you follow Reuters");
  });

  it("does not call the gated recommender for Free users — 'For You' is subscriber-only on the site too", async () => {
    const Article = {
      findAll: vi.fn().mockResolvedValue([]),
      sequelize: { literal: vi.fn((sql) => ({ __literal: sql })) },
    };
    const db = { Article };
    const user = { id: "u1", mutedKeywords: [], followedKeywords: [] };

    await getDigestArticles(db, user, { isSubscribed: false, limit: 5 });

    expect(getRecommendedArticles).not.toHaveBeenCalled();
  });

  it("for Free users, leads with followed-topic matches before backfilling with trending", async () => {
    const followedArticle = article({ id: 10, title: "Followed match", url: "https://example.com/followed" });
    const trendingArticle = article({ id: 20, title: "Trending pick", url: "https://example.com/trending" });
    const Article = {
      findAll: vi
        .fn()
        .mockResolvedValueOnce([followedArticle]) // getFollowedArticles
        .mockResolvedValueOnce([trendingArticle]), // getTrendingArticles
      sequelize: { literal: vi.fn((sql) => ({ __literal: sql })) },
    };
    const db = { Article };
    const user = { id: "u1", mutedKeywords: [], followedKeywords: ["tesla"] };

    const result = await getDigestArticles(db, user, { isSubscribed: false, limit: 5 });

    expect(result).toEqual([
      { article: followedArticle, reason: "From a topic you follow" },
      { article: trendingArticle, reason: null },
    ]);
  });

  it("for Free users, dedupes an article that shows up in both followed and trending", async () => {
    const shared = article({ id: 10, url: "https://example.com/shared" });
    const Article = {
      findAll: vi.fn().mockResolvedValueOnce([shared]).mockResolvedValueOnce([shared]),
      sequelize: { literal: vi.fn((sql) => ({ __literal: sql })) },
    };
    const db = { Article };
    const user = { id: "u1", mutedKeywords: [], followedKeywords: ["tesla"] };

    const result = await getDigestArticles(db, user, { isSubscribed: false, limit: 5 });

    expect(result).toHaveLength(1);
  });

  it("for Free users, uses a pre-fetched trendingPool instead of re-querying trending", async () => {
    const followedArticle = article({ id: 10, url: "https://example.com/followed" });
    const trendingArticle = article({ id: 20, url: "https://example.com/trending" });
    const Article = {
      // Only ever resolved once — if the trending branch queried instead of
      // using trendingPool, this mock would be consumed a second time and
      // the call count assertion below would fail.
      findAll: vi.fn().mockResolvedValueOnce([followedArticle]),
      sequelize: { literal: vi.fn((sql) => ({ __literal: sql })) },
    };
    const db = { Article };
    const user = { id: "u1", mutedKeywords: [], followedKeywords: ["tesla"] };

    const result = await getDigestArticles(db, user, {
      isSubscribed: false,
      limit: 5,
      trendingPool: [trendingArticle],
    });

    expect(Article.findAll).toHaveBeenCalledTimes(1); // getFollowedArticles only
    expect(result).toEqual([
      { article: followedArticle, reason: "From a topic you follow" },
      { article: trendingArticle, reason: null },
    ]);
  });
});

describe("buildDigestHtml", () => {
  it("renders a 'Your <cadence> picks' heading and every pick's title/link", () => {
    const html = buildDigestHtml({
      picks: [
        { article: article({ id: 42, title: "Pick one" }), reason: "Because you follow Reuters" },
        { article: article({ id: 43, title: "Pick two" }), reason: null },
      ],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });

    expect(html).toContain("Your weekly picks");
    expect(html).toContain("Pick one");
    expect(html).toContain("Pick two");
    expect(html).toContain("Because you follow Reuters");
    expect(html).toContain("Trending now"); // fallback pill for a null reason
  });

  it("links each article to its own page on the site, not the raw source url", () => {
    const html = buildDigestHtml({
      picks: [{ article: article({ id: 99, url: "https://the-source.example/story" }), reason: null }],
      frequency: "daily",
      baseUrl: "https://morningfeeds.example",
    });

    expect(html).toContain('href="https://morningfeeds.example/article/99"');
    expect(html).not.toContain("the-source.example");
  });

  it("renders the feed-scoped heading instead when feedTitle is given", () => {
    const html = buildDigestHtml({
      feedTitle: "My Custom Feed",
      picks: [{ article: article({ title: "Feed story" }), reason: null }],
      frequency: "daily",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).toContain("My Custom Feed");
    expect(html).toContain("Feed story");
  });

  it("includes a settings link with the base URL", () => {
    const html = buildDigestHtml({
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
      picks: [{ article: article({ title: '<img src=x onerror=alert(1)>' }), reason: null }],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("drops a non-http(s) urlToImage instead of rendering it as an <img> src", () => {
    const html = buildDigestHtml({
      picks: [{ article: article({ urlToImage: "javascript:alert(1)" }), reason: null }],
      frequency: "weekly",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain('src="javascript:alert(1)"');
  });

  it("escapes a malicious feed title in the feed-scoped heading", () => {
    const html = buildDigestHtml({
      feedTitle: '"><script>alert(1)</script>',
      picks: [{ article: article(), reason: null }],
      frequency: "daily",
      baseUrl: "https://morningfeeds.example",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
