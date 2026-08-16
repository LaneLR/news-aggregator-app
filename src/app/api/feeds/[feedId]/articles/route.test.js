import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function makeRequest(url = "http://localhost/api/feeds/1/articles") {
  return new NextRequest(url);
}

describe("GET /api/feeds/[feedId]/articles", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Feed.findOne.mockReset();
    db.Article.findAll.mockReset();
    db.User.findByPk.mockReset();
    db.ArticleLike.findAll.mockReset();
    db.ReadArticle.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(401);
  });

  it("rejects Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const res = await GET(makeRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(403);
  });

  it("returns 404 when the feed isn't the user's, correctly awaiting params", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(null);

    const res = await GET(makeRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(404);
    expect(db.Feed.findOne).toHaveBeenCalledWith({
      where: { id: "1", userId: expect.any(String) },
    });
  });

  it("returns an empty list when the feed has no source/category filters and no query", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(createInstanceMock({ id: 1, sourceNames: [], categories: [] }));

    const res = await GET(makeRequest(), { params: Promise.resolve({ feedId: "1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toEqual([]);
    expect(db.Article.findAll).not.toHaveBeenCalled();
  });

  it("returns matching articles with like/read status for the feed's sources", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(
      createInstanceMock({ id: 1, sourceNames: ["CNN"], categories: [] })
    );
    db.User.findByPk.mockResolvedValue(createInstanceMock({ mutedKeywords: [] }));
    const article = createInstanceMock({ url: "https://x.com", title: "A" });
    db.Article.findAll.mockResolvedValue([article]);
    db.ArticleLike.findAll.mockResolvedValue([{ articleUrl: "https://x.com" }]);
    db.ReadArticle.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/feeds/1/articles?q=nvidia"), {
      params: Promise.resolve({ feedId: "1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles[0].isLikedByUser).toBe(true);
    expect(body.articles[0].isRead).toBe(false);
  });

  it("filters by category overlap when the feed has categories but no sourceNames", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(
      createInstanceMock({ id: 1, sourceNames: [], categories: ["Tech"] })
    );
    db.User.findByPk.mockResolvedValue(createInstanceMock({ mutedKeywords: [] }));
    db.Article.findAll.mockResolvedValue([]);
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.ReadArticle.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(200);
    expect(db.Article.findAll).toHaveBeenCalled();
  });

  it("filters by the category query param even when the feed itself has no source/category filters", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(createInstanceMock({ id: 1, sourceNames: [], categories: [] }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ mutedKeywords: [] }));
    db.Article.findAll.mockResolvedValue([]);
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.ReadArticle.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/feeds/1/articles?category=Tech"), {
      params: Promise.resolve({ feedId: "1" }),
    });

    expect(res.status).toBe(200);
    // Reaches the Article.findAll call rather than the early-exit empty
    // list — proves the category param alone was enough to build a filter.
    expect(db.Article.findAll).toHaveBeenCalled();
  });

  it("applies the user's muted-keyword exclusion on top of the feed's own filters", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(
      createInstanceMock({ id: 1, sourceNames: ["CNN"], categories: [] })
    );
    db.User.findByPk.mockResolvedValue(createInstanceMock({ mutedKeywords: ["crypto"] }));
    db.Article.findAll.mockResolvedValue([]);
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.ReadArticle.findAll.mockResolvedValue([]);

    await GET(makeRequest(), { params: Promise.resolve({ feedId: "1" }) });

    const whereArg = db.Article.findAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    // sourceName-in condition + the muted-keyword exclusion fragment.
    expect(whereArg[andKey].length).toBe(2);
  });

  it("marks an article as read when it appears in the user's read history", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(
      createInstanceMock({ id: 1, sourceNames: ["CNN"], categories: [] })
    );
    db.User.findByPk.mockResolvedValue(createInstanceMock({ mutedKeywords: [] }));
    const article = createInstanceMock({ url: "https://x.com", title: "A" });
    db.Article.findAll.mockResolvedValue([article]);
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.ReadArticle.findAll.mockResolvedValue([{ articleUrl: "https://x.com" }]);

    const res = await GET(makeRequest(), { params: Promise.resolve({ feedId: "1" }) });
    const body = await res.json();

    expect(body.articles[0].isRead).toBe(true);
  });

  it("searches by query text alone when the feed itself has no source/category filters and the user mutes nothing", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockResolvedValue(createInstanceMock({ id: 1, sourceNames: [], categories: [] }));
    db.User.findByPk.mockResolvedValue(createInstanceMock({ mutedKeywords: [] }));
    db.Article.findAll.mockResolvedValue([]);
    db.ArticleLike.findAll.mockResolvedValue([]);
    db.ReadArticle.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/feeds/1/articles?q=nvidia"), {
      params: Promise.resolve({ feedId: "1" }),
    });

    expect(res.status).toBe(200);
    expect(db.Article.findAll).toHaveBeenCalled();
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Feed.findOne.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest(), { params: Promise.resolve({ feedId: "1" }) });

    expect(res.status).toBe(500);
  });
});
