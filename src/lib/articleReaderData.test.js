import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDbMock } from "@/test/dbMock";
import { makeArticle, makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));
vi.mock("@/lib/storyClustering", () => ({
  getRelatedCoverage: vi.fn().mockResolvedValue([]),
}));

const { getArticleReaderData } = await import("./articleReaderData");
const { getRelatedCoverage } = await import("@/lib/storyClustering");

function articleInstance(overrides = {}) {
  const data = makeArticle(overrides);
  return { ...data, toJSON: () => data };
}

describe("getArticleReaderData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.Article.findByPk = vi.fn().mockResolvedValue(null);
    db.ArticleLike.findOne = vi.fn().mockResolvedValue(null);
    db.ReadArticle.findOrCreate = vi.fn().mockResolvedValue([{}, true]);
    getRelatedCoverage.mockResolvedValue([]);
  });

  it("returns null when the article does not exist", async () => {
    const result = await getArticleReaderData("missing-id", null);
    expect(result).toBeNull();
  });

  it("returns gated: true for a subscriber-only category when the user isn't subscribed", async () => {
    db.Article.findByPk.mockResolvedValue(
      articleInstance({ category: ["Market"] })
    );
    const result = await getArticleReaderData("id1", makeSession({ tier: "Free" }));
    expect(result).toEqual({ gated: true });
  });

  it("allows a subscribed user through a gated category", async () => {
    db.Article.findByPk.mockResolvedValue(
      articleInstance({ category: ["Market"], content: "<p>Body text</p>" })
    );
    const result = await getArticleReaderData("id1", makeSession({ tier: "Subscribed" }));
    expect(result.gated).toBe(false);
  });

  it("allows an anonymous (no session) user through an ungated category", async () => {
    db.Article.findByPk.mockResolvedValue(
      articleInstance({ category: ["Business"], content: "<p>Body</p>" })
    );
    const result = await getArticleReaderData("id1", null);
    expect(result.gated).toBe(false);
    expect(result.article.isLikedByUser).toBe(false);
  });

  it("sanitizes article content and computes reading time", async () => {
    db.Article.findByPk.mockResolvedValue(
      articleInstance({
        category: ["Business"],
        content: "<script>alert(1)</script><p>Hello world</p>",
        urlToImage: null,
      })
    );
    const result = await getArticleReaderData("id1", null);
    expect(result.sanitizedContent).not.toContain("<script>");
    expect(result.sanitizedContent).toContain("Hello world");
    expect(result.readingTime).toBeGreaterThanOrEqual(1);
  });

  it("returns null sanitizedContent/readingTime when the article has no content", async () => {
    db.Article.findByPk.mockResolvedValue(
      articleInstance({ category: ["Business"], content: null })
    );
    const result = await getArticleReaderData("id1", null);
    expect(result.sanitizedContent).toBeNull();
    expect(result.readingTime).toBeNull();
  });

  it("strips a leading image/figure when the article also has a hero image", async () => {
    db.Article.findByPk.mockResolvedValue(
      articleInstance({
        category: ["Business"],
        urlToImage: "https://example.com/hero.jpg",
        content: '<img src="dup.jpg" /><p>Real content here</p>',
      })
    );
    const result = await getArticleReaderData("id1", null);
    expect(result.sanitizedContent).not.toContain("dup.jpg");
    expect(result.sanitizedContent).toContain("Real content here");
  });

  it("marks isLikedByUser true and records the article as read for a logged-in user", async () => {
    db.Article.findByPk.mockResolvedValue(
      articleInstance({ category: ["Business"], url: "https://example.com/a" })
    );
    db.ArticleLike.findOne.mockResolvedValue({ id: "like-1" });

    const session = makeSession({ id: "user-1" });
    const result = await getArticleReaderData("id1", session);

    expect(result.article.isLikedByUser).toBe(true);
    expect(db.ReadArticle.findOrCreate).toHaveBeenCalledWith({
      where: { userId: session.user.id, articleUrl: "https://example.com/a" },
    });
  });

  it("includes related coverage from getRelatedCoverage", async () => {
    const related = articleInstance({ title: "Related story" });
    db.Article.findByPk.mockResolvedValue(
      articleInstance({ category: ["Business"] })
    );
    getRelatedCoverage.mockResolvedValue([related]);

    const result = await getArticleReaderData("id1", null);
    expect(result.relatedCoverage).toEqual([related.toJSON()]);
  });
});
