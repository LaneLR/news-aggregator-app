import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession, makeArticle } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/news-by-category");
}

function articleInstance(overrides = {}) {
  const data = makeArticle(overrides);
  return { ...data, toJSON: () => data };
}

describe("GET /api/news-by-category", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Article.findAll.mockReset();
    db.User.findByPk.mockReset();
    db.ArticleLike.findAll.mockReset().mockResolvedValue([]);
    db.ReadArticle.findAll.mockReset().mockResolvedValue([]);
  });

  it("uses the default home sections for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);
    db.Article.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.showForYou).toBe(true);
    expect(body.showToday).toBe(true);
    expect(body.showLocal).toBe(true);
    expect(body.showTopStories).toBe(true);
    // DEFAULT_HOME_SECTIONS category tags: Business, Tech, Entertainment, Sports, Science
    expect(Object.keys(body.categories).sort()).toEqual(
      ["Business", "Entertainment", "Science", "Sports", "Tech"].sort()
    );
  });

  it("uses the signed-in user's saved homeSections when set", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: [],
      homeSections: ["forYou", "Market"],
    });
    db.Article.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.showForYou).toBe(true);
    expect(body.showToday).toBe(false);
    expect(body.showLocal).toBe(false);
    expect(body.showTopStories).toBe(false);
    expect(Object.keys(body.categories)).toEqual(["Market"]);
  });

  it("strips gated category tags for non-subscribers even if saved (defense in depth)", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free", id: "user-1" }));
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: [],
      homeSections: ["Market", "Business"],
    });
    db.Article.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(Object.keys(body.categories)).toEqual(["Business"]);
  });

  it("attaches isLikedByUser/isRead for a signed-in user's articles", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.User.findByPk.mockResolvedValue({ mutedKeywords: [], homeSections: ["Business"] });
    const article = articleInstance({ url: "https://example.com/a" });
    db.Article.findAll.mockResolvedValue([article]);
    db.ArticleLike.findAll.mockResolvedValue([{ articleUrl: "https://example.com/a" }]);
    db.ReadArticle.findAll.mockResolvedValue([{ articleUrl: "https://example.com/a" }]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.categories.Business[0].isLikedByUser).toBe(true);
    expect(body.categories.Business[0].isRead).toBe(true);
  });

  it("excludes muted-keyword titles from every category's query", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: ["crypto"],
      homeSections: ["Business"],
    });
    db.Article.findAll.mockResolvedValue([]);

    await GET(makeRequest());

    const whereArg = db.Article.findAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(whereArg)[0];
    // category-contains condition + the muted-keyword exclusion fragment.
    expect(whereArg[andKey].length).toBe(2);
  });

  it("falls back to default home sections when the session's user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.User.findByPk.mockResolvedValue(null);
    db.Article.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.showForYou).toBe(true);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(null);
    db.Article.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
  });
});
