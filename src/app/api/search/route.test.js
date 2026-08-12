import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
db.sequelize.query = vi.fn();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function makeRequest(qs) {
  return new NextRequest(`http://localhost/api/search?${qs}`);
}

describe("GET /api/search", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.sequelize.query.mockReset();
    db.User.findByPk.mockReset();
    db.ArticleLike.findAll.mockReset().mockResolvedValue([]);
    db.ReadArticle.findAll.mockReset().mockResolvedValue([]);
  });

  it("returns matching results for an anonymous query", async () => {
    mockAuth.mockResolvedValue(null);
    db.sequelize.query.mockResolvedValue([
      { url: "https://example.com/a", title: "Fed raises rates" },
    ]);

    const res = await GET(makeRequest("query=fed"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].isLikedByUser).toBe(false);
  });

  it("restricts non-subscribers to free-tier/podcast results outside Market/Journal", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    db.sequelize.query.mockResolvedValue([]);

    await GET(makeRequest("query=market"));

    const sql = db.sequelize.query.mock.calls[0][0];
    expect(sql).toContain(`"tier" = 'free' OR "sourceType" = 'podcast'`);
    expect(sql).toContain(`NOT ("category" &&`);
  });

  it("does not restrict tier/category for subscribers", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.sequelize.query.mockResolvedValue([]);

    await GET(makeRequest("query=market"));

    const sql = db.sequelize.query.mock.calls[0][0];
    expect(sql).not.toContain(`"tier" = 'free'`);
  });

  it("attaches isLikedByUser/isRead for a signed-in user", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed", id: "user-1" }));
    db.User.findByPk.mockResolvedValue({ mutedKeywords: [] });
    db.sequelize.query.mockResolvedValue([{ url: "https://example.com/a" }]);
    db.ArticleLike.findAll.mockResolvedValue([{ articleUrl: "https://example.com/a" }]);
    db.ReadArticle.findAll.mockResolvedValue([{ articleUrl: "https://example.com/a" }]);

    const res = await GET(makeRequest("query=fed"));
    const body = await res.json();

    expect(body.results[0].isLikedByUser).toBe(true);
    expect(body.results[0].isRead).toBe(true);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(null);
    db.sequelize.query.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest("query=fed"));

    expect(res.status).toBe(500);
  });
});
