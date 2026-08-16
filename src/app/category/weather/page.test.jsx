import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/CategoryPage", () => ({
  default: (props) => <div data-testid="category-page">{JSON.stringify(props)}</div>,
}));

const mockAuth = vi.fn(async () => null);
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetCategoryArticles = vi.fn(async () => ({ articles: [], totalPages: 1 }));
vi.mock("@/lib/categoryArticles", () => ({
  getCategoryArticles: (...args) => mockGetCategoryArticles(...args),
}));

const { default: WeatherNewsPage, metadata } = await import("./page");

describe("WeatherNewsPage", () => {
  it("passes the Weather category to CategoryPage and queries the weather category key", async () => {
    const element = await WeatherNewsPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith(
      expect.objectContaining({ category: "weather" })
    );
    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.category).toBe("Weather");
  });

  it("renders CategoryPage with undefined articles/totalPages when the fetch throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetCategoryArticles.mockRejectedValueOnce(new Error("db down"));

    const element = await WeatherNewsPage();
    render(element);

    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.initialArticles).toBeUndefined();
    expect(props.initialTotalPages).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Weather News");
  });
});
