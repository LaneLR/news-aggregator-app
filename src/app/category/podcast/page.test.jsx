import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeArticle, makeSession } from "@/test/fixtures";

vi.mock("@/components/CategoryPage", () => ({
  default: (props) => <div data-testid="category-page">{JSON.stringify(props)}</div>,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetCategoryArticles = vi.fn();
vi.mock("@/lib/categoryArticles", () => ({
  getCategoryArticles: (...args) => mockGetCategoryArticles(...args),
}));

const { default: PodcastPage, metadata } = await import("./page");

// Podcasts are always free regardless of tier (see Article.tier's comment
// and subscriberOnlyCategories.js) — this page follows the same shape as
// every other free category page, just always passing isSubscribed through.
describe("PodcastPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetCategoryArticles.mockReset();
  });

  it("passes the Podcast category, initial articles, and total pages to CategoryPage", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const articles = [makeArticle()];
    mockGetCategoryArticles.mockResolvedValue({ articles, totalPages: 2 });

    const element = await PodcastPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "podcast",
      userId: "user-1",
      isSubscribed: false,
    });

    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.category).toBe("Podcast");
    expect(props.initialArticles).toEqual(articles);
    expect(props.initialTotalPages).toBe(2);
  });

  it("passes undefined userId for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);
    mockGetCategoryArticles.mockResolvedValue({ articles: [], totalPages: 1 });

    const element = await PodcastPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "podcast",
      userId: undefined,
      isSubscribed: false,
    });
  });

  it("renders CategoryPage with undefined articles/totalPages when the fetch throws", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    mockGetCategoryArticles.mockRejectedValue(new Error("db down"));

    const element = await PodcastPage();
    render(element);

    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.initialArticles).toBeUndefined();
    expect(props.initialTotalPages).toBeUndefined();
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Podcasts");
    expect(metadata.description).toMatch(/podcast/i);
  });
});
