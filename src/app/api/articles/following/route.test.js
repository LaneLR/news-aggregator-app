import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession, makeArticle } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

describe("GET /api/articles/following", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
    db.Article.findAll.mockReset();
    db.ReadArticle.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns hasFollows:false when the user follows no keywords", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(createInstanceMock({ followedKeywords: [] }));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ articles: [], hasFollows: false });
    expect(db.Article.findAll).not.toHaveBeenCalled();
  });

  it("returns matching articles with read status for a Subscribed user", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.User.findByPk.mockResolvedValue(
      createInstanceMock({ followedKeywords: ["nvidia"], mutedKeywords: [] })
    );
    const article = createInstanceMock(makeArticle({ url: "https://x.com" }));
    db.Article.findAll.mockResolvedValue([article]);
    db.ReadArticle.findAll.mockResolvedValue([{ articleUrl: "https://x.com" }]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasFollows).toBe(true);
    expect(body.articles[0].isRead).toBe(true);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
