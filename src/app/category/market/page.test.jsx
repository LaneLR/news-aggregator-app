import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/CategoryPage", () => ({
  default: (props) => <div data-testid="category-page">{JSON.stringify(props)}</div>,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const mockGetCategoryArticles = vi.fn(async () => ({ articles: [], totalPages: 1 }));
vi.mock("@/lib/categoryArticles", () => ({
  getCategoryArticles: (...args) => mockGetCategoryArticles(...args),
}));

const { default: MarketNewsPage, metadata } = await import("./page");

describe("MarketNewsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetCategoryArticles.mockClear();
  });

  it("redirects anonymous visitors to /pricing", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(MarketNewsPage()).rejects.toThrow("REDIRECT:/pricing");
  });

  it("redirects Free-tier users to /pricing", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    await expect(MarketNewsPage()).rejects.toThrow("REDIRECT:/pricing");
  });

  it("renders CategoryPage with the Market category for subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));

    const element = await MarketNewsPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "market",
      userId: "user-1",
    });
    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.category).toBe("Market");
  });

  it("marks the page as noindex since gated content shouldn't be crawled", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
