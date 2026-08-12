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

const { default: JournalNewsPage, metadata } = await import("./page");

// Journal is still fully subscriber-only, but a Free/anonymous visitor now
// gets an in-app upsell teaser instead of a redirect (see
// GatedCategoryTeaser) so the page stays genuinely reachable/indexable.
describe("JournalNewsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockGetCategoryArticles.mockClear();
  });

  it("renders the Journal teaser (not the article list) for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await JournalNewsPage();
    render(element);

    expect(mockGetCategoryArticles).not.toHaveBeenCalled();
    expect(screen.getByText("Journals are for Subscribers")).toBeInTheDocument();
    expect(screen.queryByTestId("category-page")).not.toBeInTheDocument();
  });

  it("renders the Journal teaser for Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const element = await JournalNewsPage();
    render(element);

    expect(mockGetCategoryArticles).not.toHaveBeenCalled();
    expect(screen.getByText("Journals are for Subscribers")).toBeInTheDocument();
  });

  it("renders CategoryPage with the Journal category for subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));

    const element = await JournalNewsPage();
    render(element);

    expect(mockGetCategoryArticles).toHaveBeenCalledWith({
      category: "journal",
      userId: "user-1",
      isSubscribed: true,
    });
    const props = JSON.parse(screen.getByTestId("category-page").textContent);
    expect(props.category).toBe("Journal");
  });

  it("is indexable — the teaser is real, unique marketing content", () => {
    expect(metadata.robots).toBeUndefined();
  });
});
