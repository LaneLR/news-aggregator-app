import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDbMock, createInstanceMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockResolveArticleForPage = vi.fn();
vi.mock("@/lib/resolveArticleForPage", () => ({
  resolveArticleForPage: (...args) => mockResolveArticleForPage(...args),
}));

vi.mock("@/components/ArticleReader", () => ({
  default: (props) => <div data-testid="article-reader">{JSON.stringify(props)}</div>,
}));
vi.mock("@/components/JsonLd", () => ({
  default: ({ data }) => <script data-testid="json-ld">{JSON.stringify(data)}</script>,
}));

const { default: ArticlePage, generateMetadata } = await import("./page");

function makeParams(id) {
  return { params: Promise.resolve({ id }) };
}

describe("ArticlePage", () => {
  beforeEach(() => {
    mockResolveArticleForPage.mockReset();
    db.Article.findByPk.mockReset();
  });

  it("propagates a notFound() thrown by resolveArticleForPage", async () => {
    mockResolveArticleForPage.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });

    await expect(ArticlePage(makeParams("999"))).rejects.toThrow("NOT_FOUND");
  });

  it("propagates a /pricing redirect thrown by resolveArticleForPage", async () => {
    mockResolveArticleForPage.mockImplementation(() => {
      throw new Error("REDIRECT:/pricing");
    });

    await expect(ArticlePage(makeParams("1"))).rejects.toThrow("REDIRECT:/pricing");
  });

  it("renders ArticleReader with the resolved reader data", async () => {
    mockResolveArticleForPage.mockResolvedValue({
      article: {
        id: "1",
        title: "Big story",
        urlToImage: "https://example.com/img.jpg",
        publishedAt: "2026-01-01T00:00:00.000Z",
        sourceName: "Example",
      },
      sanitizedContent: "<p>Body</p>",
      relatedCoverage: [],
      readingTime: 3,
    });

    const element = await ArticlePage(makeParams("1"));
    render(element);

    const props = JSON.parse(screen.getByTestId("article-reader").textContent);
    expect(props.article.title).toBe("Big story");
    expect(props.readingTime).toBe(3);

    const jsonLd = JSON.parse(screen.getByTestId("json-ld").textContent);
    expect(jsonLd["@type"]).toBe("NewsArticle");
    expect(jsonLd.headline).toBe("Big story");
  });

  describe("generateMetadata", () => {
    it("returns an empty object when the article doesn't exist", async () => {
      db.Article.findByPk.mockResolvedValue(null);

      const meta = await generateMetadata(makeParams("999"));

      expect(meta).toEqual({});
    });

    it("builds title/description/openGraph/twitter from the article", async () => {
      db.Article.findByPk.mockResolvedValue({
        id: "1",
        title: "Big story",
        urlToImage: "https://example.com/img.jpg",
        publishedAt: "2026-01-01T00:00:00.000Z",
        sourceName: "Example",
        content: null,
      });

      const meta = await generateMetadata(makeParams("1"));

      expect(meta.title).toBe("Big story");
      expect(meta.description).toMatch(/Example/);
      expect(meta.alternates.canonical).toContain("/article/1");
      expect(meta.openGraph.images).toEqual([{ url: "https://example.com/img.jpg" }]);
      expect(meta.twitter.card).toBe("summary_large_image");
    });

    it("derives the description from sanitized article content when present", async () => {
      db.Article.findByPk.mockResolvedValue({
        id: "2",
        title: "Story with body",
        urlToImage: null,
        publishedAt: "2026-01-01T00:00:00.000Z",
        sourceName: "Example",
        content: "<p>The actual article body text.</p>",
      });

      const meta = await generateMetadata(makeParams("2"));

      expect(meta.description).toBe("The actual article body text.");
    });
  });
});
