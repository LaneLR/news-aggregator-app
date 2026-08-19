import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeArticle } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const { getCategoryArticles } = await import("./categoryArticles");

function articleInstance(overrides = {}) {
  const data = makeArticle(overrides);
  return { ...data, toJSON: () => data };
}

describe("getCategoryArticles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.Article.findAndCountAll = vi.fn().mockResolvedValue({ rows: [], count: 0 });
    db.User.findByPk = vi.fn().mockResolvedValue(null);
    db.ArticleLike.findAll = vi.fn().mockResolvedValue([]);
    db.ReadArticle.findAll = vi.fn().mockResolvedValue([]);
  });

  it("capitalizes the category slug and sorts by the default (latest) column", async () => {
    db.Article.findAndCountAll.mockResolvedValue({ rows: [articleInstance({ url: "u1" })], count: 1 });

    const result = await getCategoryArticles({ category: "business" });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [{ __literal: '"publishedAt" DESC NULLS LAST' }] })
    );
    expect(result.articles).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it("maps 'liked' and 'trending' sort keys to their DB columns", async () => {
    await getCategoryArticles({ category: "tech", sort: "liked" });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [{ __literal: '"likeCount" DESC NULLS LAST' }] })
    );

    await getCategoryArticles({ category: "tech", sort: "trending" });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [{ __literal: '"clickCount" DESC NULLS LAST' }] })
    );
  });

  it("falls back to the latest column for an unrecognized sort key", async () => {
    await getCategoryArticles({ category: "tech", sort: "bogus" });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [{ __literal: '"publishedAt" DESC NULLS LAST' }] })
    );
  });

  it("sorts NULLs last so an article with no publish date doesn't get stuck at the top of Latest forever", async () => {
    // Postgres sorts NULLs first in a plain DESC order — without NULLS
    // LAST, a malformed/dead feed item with no publishedAt would outrank
    // every genuinely recent article indefinitely.
    await getCategoryArticles({ category: "tech" });
    const orderArg = db.Article.findAndCountAll.mock.calls[0][0].order[0];
    expect(orderArg.__literal).toMatch(/DESC NULLS LAST$/);
  });

  it("computes pagination offset/totalPages from page and limit", async () => {
    db.Article.findAndCountAll.mockResolvedValue({ rows: [], count: 45 });
    const result = await getCategoryArticles({
      category: "tech",
      userId: "user-1",
      page: 2,
      limit: 20,
    });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 20 })
    );
    expect(result.totalPages).toBe(3);
  });

  it("caps the limit to ANONYMOUS_ARTICLE_LIMIT when there's no userId", async () => {
    // Rejecting page 2+ for an anonymous caller is the API route's job (see
    // route.js's 401 check) — this function just makes sure the *limit*
    // itself can never be widened past the teaser size, protecting the SSR
    // category page's own initial-load call too.
    db.Article.findAndCountAll.mockResolvedValue({ rows: [], count: 45 });
    const result = await getCategoryArticles({ category: "tech", page: 1, limit: 20 });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 0 })
    );
    expect(result.totalPages).toBe(5);
  });

  it("does not cap the limit for a logged-in user, even below ANONYMOUS_ARTICLE_LIMIT", async () => {
    db.Article.findAndCountAll.mockResolvedValue({ rows: [], count: 3 });
    await getCategoryArticles({ category: "tech", userId: "user-1", limit: 5 });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 })
    );
  });

  it("marks articles the user has liked and read", async () => {
    const liked = articleInstance({ url: "liked-url" });
    db.Article.findAndCountAll.mockResolvedValue({ rows: [liked], count: 1 });
    db.User.findByPk.mockResolvedValue({ mutedKeywords: [] });
    db.ArticleLike.findAll.mockResolvedValue([{ articleUrl: "liked-url" }]);
    db.ReadArticle.findAll.mockResolvedValue([{ articleUrl: "liked-url" }]);

    const result = await getCategoryArticles({ category: "tech", userId: "user-1" });
    expect(result.articles[0].isLikedByUser).toBe(true);
    expect(result.articles[0].isRead).toBe(true);
  });

  it("excludes the user's muted keywords from the query when present", async () => {
    db.User.findByPk.mockResolvedValue({ mutedKeywords: ["crypto"] });
    await getCategoryArticles({ category: "tech", userId: "user-1", isSubscribed: true });

    const whereArg = db.Article.findAndCountAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    // category condition + keyword-exclusion condition (subscribed, so no
    // premium-tier exclusion)
    expect(whereArg[andKey].length).toBe(2);
  });

  it("does not look up the user or their likes/reads when userId is absent", async () => {
    await getCategoryArticles({ category: "tech" });
    expect(db.User.findByPk).not.toHaveBeenCalled();
    expect(db.ArticleLike.findAll).not.toHaveBeenCalled();
  });

  it("excludes premium-tier articles for non-subscribers by default", async () => {
    await getCategoryArticles({ category: "tech" });
    const whereArg = db.Article.findAndCountAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    expect(whereArg[andKey]).toHaveLength(2); // category condition + premium-tier exclusion
    expect(whereArg[andKey][1].val).toBe(`("tier" = 'free' OR "sourceType" = 'podcast')`);
  });

  it("does not exclude premium-tier articles when isSubscribed is true", async () => {
    await getCategoryArticles({ category: "tech", isSubscribed: true });
    const whereArg = db.Article.findAndCountAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    expect(whereArg[andKey]).toHaveLength(1); // category condition only
  });

  describe("premium teaser injection", () => {
    it("sprinkles premium-tier articles into a non-subscriber's feed, flagged as teasers", async () => {
      db.Article.findAndCountAll.mockResolvedValue({
        rows: Array.from({ length: 24 }, (_, i) => articleInstance({ url: `free-${i}` })),
        count: 24,
      });
      db.Article.findAll.mockResolvedValue([
        articleInstance({ url: "premium-1", title: "Premium Headline", tier: "premium" }),
        articleInstance({ url: "premium-2", tier: "premium" }),
      ]);

      const result = await getCategoryArticles({ category: "business", userId: "user-1" });

      const teasers = result.articles.filter((a) => a.isPremiumTeaser);
      expect(teasers).toHaveLength(2);
      expect(teasers.map((t) => t.url)).toEqual(["premium-1", "premium-2"]);
      // Real free articles are untouched — same 24, still present.
      expect(result.articles.filter((a) => !a.isPremiumTeaser)).toHaveLength(24);
    });

    it("never includes the article body or interaction state on a teaser row", async () => {
      db.Article.findAndCountAll.mockResolvedValue({
        rows: [articleInstance({ url: "free-1" })],
        count: 1,
      });
      db.Article.findAll.mockResolvedValue([
        articleInstance({ url: "premium-1", content: "the full paywalled article text" }),
      ]);

      const result = await getCategoryArticles({ category: "business", userId: "user-1" });
      const teaser = result.articles.find((a) => a.isPremiumTeaser);

      expect(teaser.content).toBeUndefined();
      expect(teaser.isLikedByUser).toBeUndefined();
      expect(teaser.isRead).toBeUndefined();
      // What a locked card actually needs to render.
      expect(teaser).toMatchObject({ url: "premium-1", isPremiumTeaser: true });
      expect(teaser.title).toBeDefined();
      expect(teaser.sourceName).toBeDefined();
    });

    it("queries premium articles with tier=premium, excluding podcasts, in random order", async () => {
      db.Article.findAndCountAll.mockResolvedValue({ rows: [articleInstance()], count: 1 });
      await getCategoryArticles({ category: "business", userId: "user-1" });

      const findAllArgs = db.Article.findAll.mock.calls[0][0];
      expect(findAllArgs.order[0].val).toBe("RANDOM()");
      const whereArg = findAllArgs.where;
      const andKey = Object.getOwnPropertySymbols(whereArg)[0];
      const conditions = whereArg[andKey];
      expect(conditions).toHaveLength(2); // category condition + tier/sourceType literal
      expect(conditions[1].val).toBe(`"tier" = 'premium' AND "sourceType" != 'podcast'`);
    });

    it("requests only 1 teaser for an anonymous (no userId) request", async () => {
      db.Article.findAndCountAll.mockResolvedValue({
        rows: Array.from({ length: 10 }, (_, i) => articleInstance({ url: `free-${i}` })),
        count: 10,
      });
      await getCategoryArticles({ category: "business" });

      expect(db.Article.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }));
    });

    it("does not inject teasers for a subscribed user", async () => {
      db.Article.findAndCountAll.mockResolvedValue({ rows: [articleInstance()], count: 1 });
      await getCategoryArticles({ category: "business", userId: "user-1", isSubscribed: true });

      expect(db.Article.findAll).not.toHaveBeenCalled();
    });

    it("leaves the feed unchanged when there are no premium articles to tease", async () => {
      db.Article.findAndCountAll.mockResolvedValue({ rows: [articleInstance({ url: "free-1" })], count: 1 });
      db.Article.findAll.mockResolvedValue([]);

      const result = await getCategoryArticles({ category: "business", userId: "user-1" });

      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].isPremiumTeaser).toBeUndefined();
    });

    it("also applies the user's muted-keyword exclusion to the premium teaser query", async () => {
      db.Article.findAndCountAll.mockResolvedValue({ rows: [articleInstance()], count: 1 });
      db.User.findByPk.mockResolvedValue({ mutedKeywords: ["crypto"] });

      await getCategoryArticles({ category: "business", userId: "user-1" });

      const whereArg = db.Article.findAll.mock.calls[0][0].where;
      const andKey = Object.getOwnPropertySymbols(whereArg)[0];
      // category condition + tier/sourceType literal + keyword exclusion
      expect(whereArg[andKey]).toHaveLength(3);
    });

    it("does not query for teasers at all when the free feed itself is empty", async () => {
      db.Article.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
      await getCategoryArticles({ category: "business", userId: "user-1" });

      expect(db.Article.findAll).not.toHaveBeenCalled();
    });
  });
});
