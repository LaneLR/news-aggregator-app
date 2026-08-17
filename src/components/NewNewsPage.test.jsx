import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
// Always called with a startOfDay=<local-midnight-ISO> query param, which
// varies with the real clock — matched by prefix rather than an exact URL.
const TODAY_ROUTE = [/^\/api\/news\/today\?startOfDay=/, () => makeFetchResponse({ articles: [] })];

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
            showToday: false,
            showTopStories: false,
          }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
      TODAY_ROUTE,
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
        () => makeFetchResponse({ categories: { Business: [] }, showForYou: false, showToday: false, showTopStories: false }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
      TODAY_ROUTE,
    ]);
    render(<NewsPage />);

    expect(await screen.findByText(/no business articles right now/i)).toBeInTheDocument();
  });

  it("hides the Top Stories section when showTopStories is false and there are none", async () => {
    mockSession = null;
    mockRoutes([
      [
        "/api/news-by-category",
        () => makeFetchResponse({ categories: { Business: [] }, showForYou: false, showToday: false, showTopStories: false }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
      TODAY_ROUTE,
    ]);
    render(<NewsPage />);

    await screen.findByText(/no business articles right now/i);
    expect(screen.queryByRole("heading", { name: /top stories/i })).not.toBeInTheDocument();
  });

  it("hides the Today's News section when showToday is false and there are none", async () => {
    mockSession = null;
    mockRoutes([
      [
        "/api/news-by-category",
        () => makeFetchResponse({ categories: { Business: [] }, showForYou: false, showToday: false, showTopStories: false }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
      TODAY_ROUTE,
    ]);
    render(<NewsPage />);

    await screen.findByText(/no business articles right now/i);
    expect(screen.queryByRole("heading", { name: /today's news/i })).not.toBeInTheDocument();
  });

  it("renders the Today's News section with a link to /today", async () => {
    mockSession = null;
    const article = makeArticle({ title: "Today's headline", url: "https://example.com/today-1" });
    mockRoutes([
      [
        "/api/news-by-category",
        () => makeFetchResponse({ categories: {}, showForYou: false, showToday: true, showTopStories: false }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
      [/^\/api\/news\/today\?startOfDay=/, () => makeFetchResponse({ articles: [article] })],
    ]);
    render(<NewsPage />);

    expect(await screen.findByText("Today's headline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute("href", "/today");
  });

  it("falls back to no today articles and logs an error when the today fetch fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSession = null;
    mockRoutes([
      [
        "/api/news-by-category",
        () => makeFetchResponse({ categories: { Business: [] }, showForYou: false, showToday: true, showTopStories: false }),
      ],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
    ]);
    render(<NewsPage />);

    await screen.findByText(/no business articles right now/i);
    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to fetch today's news:", expect.any(Error))
    );
    expect(screen.queryByRole("heading", { name: /today's news/i })).not.toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("renders the Top Stories section with a related-sources badge", async () => {
    mockSession = null;
    const lead = makeArticle({ title: "Top story lead" });
    mockRoutes([
      ["/api/news-by-category", () => makeFetchResponse({ categories: {}, showForYou: false, showToday: false, showTopStories: true })],
      [
        "/api/news/top-stories",
        () =>
          makeFetchResponse({
            topStories: [{ lead, relatedCount: 2, sources: ["A", "B"] }],
          }),
      ],
      TODAY_ROUTE,
      ARCHIVE_ROUTE,
    ]);
    render(<NewsPage />);

    expect(await screen.findByText("Top story lead")).toBeInTheDocument();
    expect(screen.getByText("+2 more sources")).toBeInTheDocument();
  });

  it("falls back to empty categories and logs an error when news-by-category fails to fetch", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSession = null;
    mockRoutes([["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })], TODAY_ROUTE]);
    render(<NewsPage />);

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to fetch news:", expect.any(Error))
    );
    consoleErrorSpy.mockRestore();
  });

  it("falls back to no top stories and logs an error when top-stories fails to fetch", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSession = null;
    mockRoutes([
      [
        "/api/news-by-category",
        () => makeFetchResponse({ categories: { Business: [] }, showForYou: false, showToday: false, showTopStories: true }),
      ],
      TODAY_ROUTE,
    ]);
    render(<NewsPage />);

    await screen.findByText(/no business articles right now/i);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to fetch top stories:", expect.any(Error));
    expect(screen.queryByRole("heading", { name: /top stories/i })).not.toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("shows the For You / Trending hero carousel when showForYou is true", async () => {
    mockSession = null;
    mockRoutes([
      ["/api/news-by-category", () => makeFetchResponse({ categories: {}, showForYou: true, showToday: false, showTopStories: false })],
      ["/api/news/top-stories", () => makeFetchResponse({ topStories: [] })],
      ["/api/articles/trending?sort=trending", () => makeFetchResponse({ articles: [] })],
      TODAY_ROUTE,
    ]);
    render(<NewsPage />);

    expect(await screen.findByRole("heading", { name: /trending/i })).toBeInTheDocument();
  });
});
