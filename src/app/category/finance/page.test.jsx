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

const { default: FinanceNewsPage, metadata } = await import("./page");

// Finance is no longer fully subscriber-only — it shows a curated free
// selection of sources to everyone (see subscriberOnlyCategories.js), so
// this page never redirects; getCategoryArticles itself filters premium
// sources for non-subscribers.
describe("FinanceNewsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetCategoryArticles.mockClear();
  });

  it("renders CategoryPage for anonymous visitors instead of redirecting", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await FinanceNewsPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "finance",
      userId: undefined,
      isSubscribed: false,
    });
    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.category).toBe("Finance");
  });

  it("passes isSubscribed: false for a Free-tier user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Free" }));

    await FinanceNewsPage();

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "finance",
      userId: "user-1",
      isSubscribed: false,
    });
  });

  it("renders CategoryPage with the Finance category for subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));

    const element = await FinanceNewsPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "finance",
      userId: "user-1",
      isSubscribed: true,
    });
    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.category).toBe("Finance");
  });

  it("is indexable — Finance is no longer redirect-gated", () => {
    expect(metadata.robots).toBeUndefined();
  });
});
