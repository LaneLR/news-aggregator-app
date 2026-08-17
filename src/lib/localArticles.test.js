import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeArticle } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const { getLocalArticles } = await import("./localArticles");

const HUB = "dallas-fort-worth";

function articleInstance(overrides = {}) {
  const data = makeArticle(overrides);
  return { ...data, toJSON: () => data };
}

describe("getLocalArticles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.Article.findAndCountAll = vi.fn().mockResolvedValue({ rows: [], count: 0 });
    db.User.findByPk = vi.fn().mockResolvedValue(null);
    db.ArticleLike.findAll = vi.fn().mockResolvedValue([]);
    db.ReadArticle.findAll = vi.fn().mockResolvedValue([]);
  });

  it("filters by hubCity and sorts newest-first by default", async () => {
    db.Article.findAndCountAll.mockResolvedValue({ rows: [articleInstance({ url: "u1" })], count: 1 });

    const result = await getLocalArticles({ hubCityId: HUB });

    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [{ __literal: '"publishedAt" DESC NULLS LAST' }] })
    );
    const whereArg = db.Article.findAndCountAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    expect(whereArg[andKey][0]).toEqual({ hubCity: HUB });
    expect(result.articles).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("sorts oldest-first (plain ascending, not the NULLS-LAST literal) for sort=oldest", async () => {
    await getLocalArticles({ hubCityId: HUB, sort: "oldest" });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [["publishedAt", "ASC"]] })
    );
  });

  it("sorts by likeCount for sort=trending", async () => {
    await getLocalArticles({ hubCityId: HUB, sort: "trending" });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [{ __literal: '"likeCount" DESC NULLS LAST' }] })
    );
  });

  it("falls back to newest for an unrecognized sort key", async () => {
    await getLocalArticles({ hubCityId: HUB, sort: "bogus" });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [{ __literal: '"publishedAt" DESC NULLS LAST' }] })
    );
  });

  it("computes pagination offset/totalPages from page and limit", async () => {
    db.Article.findAndCountAll.mockResolvedValue({ rows: [], count: 45 });
    const result = await getLocalArticles({ hubCityId: HUB, page: 2, limit: 20 });
    expect(db.Article.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 20 })
    );
    expect(result.totalPages).toBe(3);
  });

  it("marks articles the user has liked and read", async () => {
    const liked = articleInstance({ url: "liked-url" });
    db.Article.findAndCountAll.mockResolvedValue({ rows: [liked], count: 1 });
    db.User.findByPk.mockResolvedValue({ mutedKeywords: [] });
    db.ArticleLike.findAll.mockResolvedValue([{ articleUrl: "liked-url" }]);
    db.ReadArticle.findAll.mockResolvedValue([{ articleUrl: "liked-url" }]);

    const result = await getLocalArticles({ hubCityId: HUB, userId: "user-1" });
    expect(result.articles[0].isLikedByUser).toBe(true);
    expect(result.articles[0].isRead).toBe(true);
  });

  it("excludes the user's muted keywords from the query when present", async () => {
    db.User.findByPk.mockResolvedValue({ mutedKeywords: ["crypto"] });
    await getLocalArticles({ hubCityId: HUB, userId: "user-1", isSubscribed: true });

    const whereArg = db.Article.findAndCountAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    // hubCity condition + keyword-exclusion condition (subscribed, so no
    // premium-tier exclusion)
    expect(whereArg[andKey].length).toBe(2);
  });

  it("does not look up the user or their likes/reads when userId is absent", async () => {
    await getLocalArticles({ hubCityId: HUB });
    expect(db.User.findByPk).not.toHaveBeenCalled();
    expect(db.ArticleLike.findAll).not.toHaveBeenCalled();
  });

  it("excludes premium-tier articles for non-subscribers by default", async () => {
    await getLocalArticles({ hubCityId: HUB });
    const whereArg = db.Article.findAndCountAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    // hubCity condition + premium-tier exclusion only — no gated-category
    // rule, since local sources are never tagged Market/Journal.
    expect(whereArg[andKey]).toHaveLength(2);
    expect(whereArg[andKey][1].val).toBe(`("tier" = 'free' OR "sourceType" = 'podcast')`);
  });

  it("does not exclude premium articles when isSubscribed is true", async () => {
    await getLocalArticles({ hubCityId: HUB, isSubscribed: true });
    const whereArg = db.Article.findAndCountAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    expect(whereArg[andKey]).toHaveLength(1); // hubCity condition only
  });
});
