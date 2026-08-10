import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession, makeArticle } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function makeRequest(url = "http://localhost/api/articles/liked") {
  return new NextRequest(url);
}

describe("GET /api/articles/liked", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.ArticleLike.findAll.mockReset();
    db.Article.findAll.mockReset();
    db.ReadArticle.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
  });

  it("returns an empty list when the user has no likes", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.ArticleLike.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toEqual([]);
    expect(db.Article.findAll).not.toHaveBeenCalled();
  });

  it("returns liked articles in like-order with isLikedByUser/isRead flags", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.ArticleLike.findAll.mockResolvedValue([
      { articleUrl: "https://b.com" },
      { articleUrl: "https://a.com" },
    ]);
    db.Article.findAll.mockResolvedValue([
      createInstanceMock(makeArticle({ url: "https://a.com" })),
      createInstanceMock(makeArticle({ url: "https://b.com" })),
    ]);
    db.ReadArticle.findAll.mockResolvedValue([{ articleUrl: "https://b.com" }]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles.map((a) => a.url)).toEqual(["https://b.com", "https://a.com"]);
    expect(body.articles[0].isRead).toBe(true);
    expect(body.articles[1].isRead).toBe(false);
    expect(body.articles.every((a) => a.isLikedByUser)).toBe(true);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.ArticleLike.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
  });
});
