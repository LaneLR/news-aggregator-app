import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse } from "@/test/fixtures";

const mockSession = { value: null };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession.value, status: mockSession.value ? "authenticated" : "unauthenticated" }),
}));

vi.mock("./NewsCardThree", () => ({
  default: ({ article, isSelected, onToggleSelect, selectionMode }) => (
    <div>
      Card:{article.title}
      {selectionMode && (
        <button type="button" onClick={onToggleSelect}>
          {isSelected ? "Selected" : "Select"}:{article.title}
        </button>
      )}
    </div>
  ),
}));
vi.mock("./ThreePaneLayout", () => ({ default: ({ articles }) => <div>ThreePane:{articles.length}</div> }));
vi.mock("./MarkAllReadButton", () => ({
  default: ({ onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      Mark all as read
    </button>
  ),
}));
vi.mock("./ViewDensityToggle", () => ({ default: () => <div>DensityToggle</div> }));
vi.mock("./CardSkeleton", () => ({ default: () => <div>Skeleton</div> }));
vi.mock("./PullToRefreshIndicator", () => ({ default: () => null }));
vi.mock("./MarketTicker", () => ({ default: () => <div>MarketTicker</div> }));
vi.mock("./MarketChart", () => ({ default: () => <div>MarketChart</div> }));
vi.mock("./SectorPerformance", () => ({ default: () => <div>SectorPerformance</div> }));
vi.mock("./MostCovered", () => ({ default: () => <div>MostCovered</div> }));
vi.mock("./Watchlist", () => ({ default: () => <div>Watchlist</div> }));

const layoutPrefs = { value: { loaded: true, viewDensity: "card", setViewDensity: vi.fn() } };
vi.mock("@/lib/useLayoutPrefs", () => ({ useLayoutPrefs: () => layoutPrefs.value }));

const markAllRead = { value: { hasUnread: false, markingAllRead: false, handleMarkAllRead: vi.fn() } };
vi.mock("@/lib/useMarkAllRead", () => ({ useMarkAllRead: () => markAllRead.value }));

vi.mock("@/lib/useArticleShortcuts", () => ({
  useArticleShortcuts: () => ({ selectedIndex: -1, cardRefs: { current: [] } }),
}));

vi.mock("@/lib/usePullToRefresh", () => ({
  usePullToRefresh: () => ({ pullDistance: 0, isRefreshing: false, pullHandlers: {} }),
}));

const { default: CategoryPage } = await import("./CategoryPage");

function mockFetchRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? url.toString() === matcher : matcher.test(url.toString());
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("CategoryPage", () => {
  beforeEach(() => {
    mockSession.value = null;
    layoutPrefs.value = { loaded: true, viewDensity: "card", setViewDensity: vi.fn() };
    markAllRead.value = { hasUnread: false, markingAllRead: false, handleMarkAllRead: vi.fn() };
  });

  it("renders SSR-provided initial articles without an extra loading state", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    const initialArticles = [makeArticle({ title: "SSR Story" })];

    render(<CategoryPage category="business" initialArticles={initialArticles} initialTotalPages={1} />);

    expect(screen.getByText("Card:SSR Story")).toBeInTheDocument();
    expect(screen.queryAllByText("Skeleton")).toHaveLength(0);
  });

  it("shows loading skeletons and then articles when there's no SSR data", async () => {
    mockFetchRoutes([
      [/\/api\/articles\/business/, () => makeFetchResponse({ articles: [makeArticle({ title: "Fetched Story" })], totalPages: 1 })],
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
    ]);

    render(<CategoryPage category="business" />);
    expect(screen.getAllByText("Skeleton").length).toBeGreaterThan(0);
    expect(await screen.findByText("Card:Fetched Story")).toBeInTheDocument();
  });

  it("shows an error message when the initial load fails", async () => {
    mockFetchRoutes([
      [/\/api\/articles\/business/, () => makeFetchResponse(null, { ok: false, status: 500 })],
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
    ]);

    render(<CategoryPage category="business" />);
    expect(await screen.findByText(/Error:/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no articles", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    render(<CategoryPage category="business" initialArticles={[]} initialTotalPages={1} />);
    expect(screen.getByText(/No articles found for Business/)).toBeInTheDocument();
  });

  it("renders the market widgets only for the Market category", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    render(<CategoryPage category="Market" initialArticles={[]} initialTotalPages={1} />);
    expect(screen.getByText("MarketTicker")).toBeInTheDocument();
    expect(screen.getByText("Watchlist")).toBeInTheDocument();
  });

  it("does not render market widgets for a non-Market category", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    render(<CategoryPage category="business" initialArticles={[]} initialTotalPages={1} />);
    expect(screen.queryByText("MarketTicker")).not.toBeInTheDocument();
  });

  it("switches sort and reloads articles", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/business\?sort=trending/, () => makeFetchResponse({ articles: [makeArticle({ title: "Trending Story" })], totalPages: 1 })],
    ]);

    render(<CategoryPage category="business" initialArticles={[makeArticle({ title: "Latest Story" })]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: "Trending" }));

    expect(await screen.findByText("Card:Trending Story")).toBeInTheDocument();
  });

  it("loads more articles and appends them, then shows 'caught up' at the last page", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/business\?sort=latest&page=2/, () => makeFetchResponse({ articles: [makeArticle({ title: "Page Two Story" })], totalPages: 2 })],
    ]);

    render(
      <CategoryPage
        category="business"
        initialArticles={[makeArticle({ title: "Page One Story" })]}
        initialTotalPages={2}
      />
    );
    await user.click(screen.getByRole("button", { name: "Load More" }));

    expect(await screen.findByText("Card:Page Two Story")).toBeInTheDocument();
    expect(screen.getByText("Card:Page One Story")).toBeInTheDocument();
    expect(await screen.findByText("You're all caught up.")).toBeInTheDocument();
  });

  it("toggles select mode and enters bulk-selection for a signed-in user", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: "archive-1" })]]);

    render(
      <CategoryPage category="business" initialArticles={[makeArticle({ title: "Selectable Story" })]} initialTotalPages={1} />
    );
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByRole("button", { name: /Select:Selectable Story/ }));

    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("does not show the Select button for signed-out users", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    render(<CategoryPage category="business" initialArticles={[makeArticle()]} initialTotalPages={1} />);
    expect(screen.queryByRole("button", { name: "Select" })).not.toBeInTheDocument();
  });

  it("shows the mark-all-read button when there is unread content", async () => {
    const user = userEvent.setup();
    markAllRead.value = { hasUnread: true, markingAllRead: false, handleMarkAllRead: vi.fn() };
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);

    render(<CategoryPage category="business" initialArticles={[makeArticle()]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(markAllRead.value.handleMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("renders the three-pane layout in reader density", () => {
    layoutPrefs.value = { loaded: true, viewDensity: "reader", setViewDensity: vi.fn() };
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    render(<CategoryPage category="business" initialArticles={[makeArticle(), makeArticle()]} initialTotalPages={1} />);
    expect(screen.getByText("ThreePane:2")).toBeInTheDocument();
  });
});
