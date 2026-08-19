import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockResolveArticleForPage = vi.fn();
vi.mock("@/lib/resolveArticleForPage", () => ({
  resolveArticleForPage: (...args) => mockResolveArticleForPage(...args),
}));

vi.mock("@/components/ArticleModal", () => ({
  default: (props) => <div data-testid="article-modal">{JSON.stringify(props)}</div>,
}));

const { default: ArticleModalPage } = await import("./page");

function makeParams(id) {
  return { params: Promise.resolve({ id }) };
}

describe("ArticleModalPage (intercepted @modal route)", () => {
  beforeEach(() => {
    mockResolveArticleForPage.mockReset();
  });

  it("propagates a notFound()/redirect() thrown by resolveArticleForPage unchanged", async () => {
    mockResolveArticleForPage.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });

    await expect(ArticleModalPage(makeParams("999"))).rejects.toThrow("NOT_FOUND");
  });

  it("renders ArticleModal with the resolved reader data", async () => {
    mockResolveArticleForPage.mockResolvedValue({
      article: { id: "1", title: "Big story" },
      sanitizedContent: "<p>Body</p>",
      relatedCoverage: [],
      readingTime: 3,
    });

    const element = await ArticleModalPage(makeParams("1"));
    render(element);

    const props = JSON.parse(screen.getByTestId("article-modal").textContent);
    expect(props.article.title).toBe("Big story");
    expect(props.readingTime).toBe(3);
  });

  it("resolves the article using the id from the dynamic route param", async () => {
    mockResolveArticleForPage.mockResolvedValue({
      article: { id: "42" },
      sanitizedContent: null,
      relatedCoverage: [],
      readingTime: null,
    });

    await ArticleModalPage(makeParams("42"));

    expect(mockResolveArticleForPage).toHaveBeenCalledWith("42");
  });
});
