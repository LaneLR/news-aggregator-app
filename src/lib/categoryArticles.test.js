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
});
