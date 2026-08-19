import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/CategoryPage", () => ({
  default: (props) => <div data-testid="category-page">{JSON.stringify(props)}</div>,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockGetCategoryArticles = vi.fn(async () => ({ articles: [], totalPages: 1 }));
vi.mock("@/lib/categoryArticles", () => ({
  getCategoryArticles: (...args) => mockGetCategoryArticles(...args),
}));

const { default: MarketNewsPage, metadata } = await import("./page");

// Market is still fully subscriber-only, but a Free/anonymous visitor now
// gets an in-app upsell teaser instead of a redirect (see
// GatedCategoryTeaser) so the page stays genuinely reachable/indexable.
describe("MarketNewsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetCategoryArticles.mockClear();
  });

  it("renders the Market teaser (not the article list) for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await MarketNewsPage();
    render(element);

    expect(mockGetCategoryArticles).not.toHaveBeenCalled();
    expect(screen.getByText("Market coverage is for MochaReads Pro")).toBeInTheDocument();
    expect(screen.queryByTestId("category-page")).not.toBeInTheDocument();
  });

  it("renders the Market teaser for Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const element = await MarketNewsPage();
    render(element);

    expect(mockGetCategoryArticles).not.toHaveBeenCalled();
    expect(screen.getByText("Market coverage is for MochaReads Pro")).toBeInTheDocument();
  });

  it("renders CategoryPage with the Market category for subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));

    const element = await MarketNewsPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "market",
      userId: "user-1",
      isSubscribed: true,
    });
    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.category).toBe("Market");
  });

  it("renders CategoryPage with undefined articles/totalPages when the fetch throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));
    mockGetCategoryArticles.mockRejectedValueOnce(new Error("db down"));

    const element = await MarketNewsPage();
    render(element);

    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.initialArticles).toBeUndefined();
    expect(props.initialTotalPages).toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
  });

  it("is indexable — the teaser is real, unique marketing content", () => {
    expect(metadata.robots).toBeUndefined();
  });
});
