import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeArticle, makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { default: NewsPage } = await import("./NewNewsPage");

const ARCHIVE_ROUTE = ["/api/archives", () => makeFetchResponse({ archives: [] })];

function mockRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    const urlStr = url.toString();
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? urlStr === matcher : matcher.test(urlStr);
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${urlStr}`));
  });
}

describe("NewNewsPage", () => {
  it("renders default category sections (skeletons) before data loads", () => {
    mockSession = null;
    global.fetch.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<NewsPage />);

    // DEFAULT_CATEGORY_SECTIONS includes Business/Tech/Entertainment/Sports/Science.
    expect(screen.getByText("Business")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("renders real category sections once /api/news-by-category resolves", async () => {
    mockSession = null;
    mockRoutes([
      [
        "/api/news-by-category",
        () =>
          makeFetchResponse({
            categories: { Business: [makeArticle({ title: "Biz story" })] },
            showForYou: false,
            showTopStories: false,
          }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
      ARCHIVE_ROUTE,
    ]);
    render(<NewsPage />);

    expect(await screen.findByText("Biz story")).toBeInTheDocument();
  });

  it("shows an empty-section message when a category has no articles", async () => {
    mockSession = null;
    mockRoutes([
      [
        "/api/news-by-category",
        () => makeFetchResponse({ categories: { Business: [] }, showForYou: false, showTopStories: false }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
    ]);
    render(<NewsPage />);

    expect(await screen.findByText(/no business articles right now/i)).toBeInTheDocument();
  });

  it("hides the Top Stories section when showTopStories is false and there are none", async () => {
    mockSession = null;
    mockRoutes([
      [
        "/api/news-by-category",
        () => makeFetchResponse({ categories: { Business: [] }, showForYou: false, showTopStories: false }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
    ]);
    render(<NewsPage />);

    await screen.findByText(/no business articles right now/i);
    expect(screen.queryByRole("heading", { name: /top stories/i })).not.toBeInTheDocument();
  });

  it("renders the Top Stories section with a related-sources badge", async () => {
    mockSession = null;
    const lead = makeArticle({ title: "Top story lead" });
    mockRoutes([
      ["/api/news-by-category", () => makeFetchResponse({ categories: {}, showForYou: false, showTopStories: true })],
      [
        "/api/news/top-stories",
        () =>
          makeFetchResponse({
            topStories: [{ lead, relatedCount: 2, sources: ["A", "B"] }],
          }),
      ],
      ARCHIVE_ROUTE,
    ]);
    render(<NewsPage />);

    expect(await screen.findByText("Top story lead")).toBeInTheDocument();
    expect(screen.getByText("+2 more sources")).toBeInTheDocument();
  });

  it("shows the For You / Trending hero carousel when showForYou is true", async () => {
    mockSession = null;
    mockRoutes([
      ["/api/news-by-category", () => makeFetchResponse({ categories: {}, showForYou: true, showTopStories: false })],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
      ["/api/articles/trending?sort=trending", () => makeFetchResponse({ articles: [] })],
    ]);
    render(<NewsPage />);

    expect(await screen.findByRole("heading", { name: /trending/i })).toBeInTheDocument();
  });
});
