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

const { default: BusinessNewsPage, metadata } = await import("./page");

describe("BusinessNewsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetCategoryArticles.mockReset();
  });

  it("passes the Business category, initial articles, and total pages to CategoryPage", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const articles = [makeArticle()];
    mockGetCategoryArticles.mockResolvedValue({ articles, totalPages: 3 });

    const element = await BusinessNewsPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "business",
      userId: "user-1",
    });

    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.category).toBe("Business");
    expect(props.initialArticles).toEqual(articles);
    expect(props.initialTotalPages).toBe(3);
  });

  it("passes undefined userId for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);
    mockGetCategoryArticles.mockResolvedValue({ articles: [], totalPages: 1 });

    const element = await BusinessNewsPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "business",
      userId: undefined,
    });
  });

  it("renders CategoryPage with undefined articles/totalPages when the fetch throws", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    mockGetCategoryArticles.mockRejectedValue(new Error("db down"));

    const element = await BusinessNewsPage();
    render(element);

    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.initialArticles).toBeUndefined();
    expect(props.initialTotalPages).toBeUndefined();
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Business News");
    expect(metadata.description).toMatch(/business/i);
  });
});
