import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse } from "@/test/fixtures";

const mockSession = { value: null };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession.value, status: mockSession.value ? "authenticated" : "unauthenticated" }),
}));

vi.mock("./NewsCardThree", () => ({
  default: ({ article, isSelected, onToggleSelect, selectionMode, innerRef }) => (
    <div ref={innerRef}>
      Card:{article.title}
      {selectionMode && (
        <button type="button" onClick={onToggleSelect}>
          {isSelected ? "Selected" : "Select"}:{article.title}
        </button>
      )}
    </div>
  ),
}));
vi.mock("./ThreePaneLayout", () => ({
  default: ({ articles, selectedArticleId, onSelectArticle }) => (
    <div>
      {`ThreePane:${articles.length}`}
      <div data-testid="selected-marker">{selectedArticleId ?? "none"}</div>
      <button type="button" onClick={() => onSelectArticle(articles[0])}>
        Open first
      </button>
      <button type="button" onClick={() => onSelectArticle(null)}>
        Close reader
      </button>
    </div>
  ),
}));
vi.mock("./PremiumTeaserCard", () => ({
  default: ({ article }) => <div>Teaser:{article.title}</div>,
}));
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

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

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
    toast.error.mockClear();
  });

  it("shows the free-tier upsell nudge for a non-subscriber on a partially-gated category", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    render(<CategoryPage category="business" initialArticles={[]} initialTotalPages={1} />);

    expect(screen.getByText(/curated free selection of Business sources/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Subscribe" })).toHaveAttribute("href", "/pricing");
  });

  it("does not show the upsell nudge for a subscribed user", () => {
    mockSession.value = { user: { id: "user-1", tier: "Subscribed" } };
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    render(<CategoryPage category="business" initialArticles={[]} initialTotalPages={1} />);

    expect(screen.queryByText(/curated free selection/i)).not.toBeInTheDocument();
  });

  it("does not show the upsell nudge on the Podcast category — it's fully free", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    render(<CategoryPage category="Podcast" initialArticles={[]} initialTotalPages={1} />);

    expect(screen.queryByText(/curated free selection/i)).not.toBeInTheDocument();
  });

  it("renders SSR-provided initial articles without an extra loading state", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    const initialArticles = [makeArticle({ title: "SSR Story" })];

    render(<CategoryPage category="business" initialArticles={initialArticles} initialTotalPages={1} />);

    expect(screen.getByText("Card:SSR Story")).toBeInTheDocument();
    expect(screen.queryAllByText("Skeleton")).toHaveLength(0);
  });

  it("renders a locked teaser card for an article flagged isPremiumTeaser", () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    const initialArticles = [
      makeArticle({ title: "Free Story" }),
      { ...makeArticle({ title: "Locked Story" }), isPremiumTeaser: true },
    ];

    render(<CategoryPage category="business" initialArticles={initialArticles} initialTotalPages={1} />);

    expect(screen.getByText("Card:Free Story")).toBeInTheDocument();
    expect(screen.getByText("Teaser:Locked Story")).toBeInTheDocument();
    // The mocked NewsCardThree renders "Card:" for every article — a teaser
    // must never fall through to it, since that'd be the real card (with a
    // working read-more link) rendering a Pro-only article for a Free viewer.
    expect(screen.queryByText("Card:Locked Story")).not.toBeInTheDocument();
  });

  it("excludes teaser articles from the three-pane reader — nothing to open there", () => {
    layoutPrefs.value = { loaded: true, viewDensity: "reader", setViewDensity: vi.fn() };
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    const initialArticles = [
      makeArticle({ title: "Free Story" }),
      { ...makeArticle({ title: "Locked Story" }), isPremiumTeaser: true },
    ];

    render(<CategoryPage category="business" initialArticles={initialArticles} initialTotalPages={1} />);

    expect(screen.getByText("ThreePane:1")).toBeInTheDocument();
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

  it("keeps showing already-loaded articles instead of an error when a re-fetch fails", async () => {
    // Regression test: switching sort (or any other trigger of loadArticles)
    // after articles are already on screen used to replace a perfectly
    // good, already-loaded list with a bare "Error: Failed to fetch" the
    // moment any re-fetch failed — even though the old list was still
    // completely valid to keep showing.
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/business\?sort=trending/, () => makeFetchResponse(null, { ok: false, status: 500 })],
    ]);

    render(<CategoryPage category="business" initialArticles={[makeArticle({ title: "Latest Story" })]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: "Trending" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't refresh articles. Showing what's already loaded."));
    expect(screen.getByText("Card:Latest Story")).toBeInTheDocument();
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
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

  it("switches sort and reloads articles for a signed-in user", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/business\?sort=trending/, () => makeFetchResponse({ articles: [makeArticle({ title: "Trending Story" })], totalPages: 1 })],
    ]);

    render(<CategoryPage category="business" initialArticles={[makeArticle({ title: "Latest Story" })]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: "Trending" }));

    expect(await screen.findByText("Card:Trending Story")).toBeInTheDocument();
  });

  it("loads more articles and appends them, then shows 'caught up' at the last page, for a signed-in user", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
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

  it("switches from Trending back to Latest and reloads for a signed-in user", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/business\?sort=trending/, () => makeFetchResponse({ articles: [makeArticle({ title: "Trending Story" })], totalPages: 1 })],
      [/\/api\/articles\/business\?sort=latest/, () => makeFetchResponse({ articles: [makeArticle({ title: "Latest Story" })], totalPages: 1 })],
    ]);

    render(<CategoryPage category="business" initialArticles={[makeArticle({ title: "SSR Story" })]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: "Trending" }));
    expect(await screen.findByText("Card:Trending Story")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Latest" }));
    expect(await screen.findByText("Card:Latest Story")).toBeInTheDocument();
  });

  it("switches to Most Liked for a signed-in user", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/business\?sort=liked/, () => makeFetchResponse({ articles: [makeArticle({ title: "Liked Story" })], totalPages: 1 })],
    ]);

    render(<CategoryPage category="business" initialArticles={[makeArticle({ title: "Latest Story" })]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: "Most Liked" }));

    expect(await screen.findByText("Card:Liked Story")).toBeInTheDocument();
  });

  it("deselects a previously-selected article in bulk-select mode", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);

    render(<CategoryPage category="business" initialArticles={[makeArticle({ title: "Toggle Story" })]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByRole("button", { name: /Select:Toggle Story/ }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Selected:Toggle Story/ }));
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });

  it("shows a sign-in prompt instead of fetching when a signed-out user selects Trending", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [
        /\/api\/articles\/business\?sort=trending/,
        () => {
          throw new Error("Should not fetch a gated sort while signed out");
        },
      ],
    ]);

    render(<CategoryPage category="business" initialArticles={[makeArticle({ title: "Latest Story" })]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: /Trending/ }));

    expect(await screen.findByText(/Sign in to see Trending Business articles\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Create Account" })).toHaveAttribute("href", "/register");
    expect(screen.queryByText("Card:Latest Story")).not.toBeInTheDocument();
  });

  it("shows a sign-in prompt instead of a Load More button for a signed-out user", async () => {
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);

    render(
      <CategoryPage
        category="business"
        initialArticles={[makeArticle({ title: "Page One Story" })]}
        initialTotalPages={2}
      />
    );

    expect(await screen.findByText("Sign in to load more articles.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load More" })).not.toBeInTheDocument();
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

  it("selects and closes an article in reader density", async () => {
    const user = userEvent.setup();
    layoutPrefs.value = { loaded: true, viewDensity: "reader", setViewDensity: vi.fn() };
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);
    const article = makeArticle({ id: "reader-article" });
    render(<CategoryPage category="business" initialArticles={[article]} initialTotalPages={1} />);

    expect(screen.getByTestId("selected-marker")).toHaveTextContent("none");
    await user.click(screen.getByRole("button", { name: "Open first" }));
    expect(screen.getByTestId("selected-marker")).toHaveTextContent("reader-article");

    await user.click(screen.getByRole("button", { name: "Close reader" }));
    expect(screen.getByTestId("selected-marker")).toHaveTextContent("none");
  });

  it("runs the bulk mark-read action for selected articles", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/mark-all-read/, () => makeFetchResponse({ success: true })],
    ]);

    render(
      <CategoryPage category="business" initialArticles={[makeArticle({ title: "Bulk Story" })]} initialTotalPages={1} />
    );
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByRole("button", { name: /Select:Bulk Story/ }));
    await user.click(screen.getByRole("button", { name: "Mark read" }));

    await waitFor(() => expect(screen.queryByText("1 selected")).not.toBeInTheDocument());
  });

  it("runs the bulk save action against the default archive", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    const saveCalls = [];
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: "archive-1" })],
      [
        /\/api\/archives\/archive-1\/articles/,
        () => {
          saveCalls.push(1);
          return makeFetchResponse({ success: true });
        },
      ],
    ]);

    render(
      <CategoryPage category="business" initialArticles={[makeArticle({ title: "Save Story" })]} initialTotalPages={1} />
    );
    await waitFor(() => screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByRole("button", { name: /Select:Save Story/ }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(saveCalls.length).toBe(1));
  });

  it("runs the bulk like action for not-yet-liked selected articles", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/like/, () => makeFetchResponse({ success: true })],
    ]);

    render(
      <CategoryPage
        category="business"
        initialArticles={[makeArticle({ title: "Like Story", isLikedByUser: false })]}
        initialTotalPages={1}
      />
    );
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByRole("button", { name: /Select:Like Story/ }));
    await user.click(screen.getByRole("button", { name: "Like" }));

    await waitFor(() => expect(screen.queryByText("1 selected")).not.toBeInTheDocument());
  });

  it("cancels bulk-selection mode", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([[/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })]]);

    render(<CategoryPage category="business" initialArticles={[makeArticle({ title: "Cancel Story" })]} initialTotalPages={1} />);
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByRole("button", { name: /Select:Cancel Story/ }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel selection" }));
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  });

  it("shows a 'new articles available' banner on window focus and refreshes on click", async () => {
    const user = userEvent.setup();
    const older = makeArticle({ title: "Old Story", publishedAt: "2020-01-01T00:00:00.000Z" });
    const newer = makeArticle({ title: "Fresh Story", publishedAt: "2030-01-01T00:00:00.000Z" });
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/business\?sort=latest&page=1/, () => makeFetchResponse({ articles: [newer], totalPages: 1 })],
    ]);

    render(<CategoryPage category="business" initialArticles={[older]} initialTotalPages={1} />);
    expect(screen.queryByText("New articles available")).not.toBeInTheDocument();

    window.dispatchEvent(new Event("focus"));
    expect(await screen.findByText("New articles available")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New articles available" }));
    expect(await screen.findByText("Card:Fresh Story")).toBeInTheDocument();
    expect(screen.queryByText("New articles available")).not.toBeInTheDocument();
  });

  it("doesn't re-show the banner on a later focus once the same 'latest' article has already been loaded in", async () => {
    // Regression test: the focus listener used to close over latestTimestamp
    // directly, so once refreshed via something other than a category/sort
    // change, the listener kept comparing against the stale pre-refresh
    // timestamp and could re-fire for an article the user had already seen.
    const older = makeArticle({ title: "Old Story", publishedAt: "2020-01-01T00:00:00.000Z" });
    const newer = makeArticle({ title: "Fresh Story", publishedAt: "2030-01-01T00:00:00.000Z" });
    mockFetchRoutes([
      [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: null })],
      [/\/api\/articles\/business\?sort=latest&page=1/, () => makeFetchResponse({ articles: [newer], totalPages: 1 })],
    ]);

    render(<CategoryPage category="business" initialArticles={[older]} initialTotalPages={1} />);

    window.dispatchEvent(new Event("focus"));
    expect(await screen.findByText("New articles available")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "New articles available" }));
    expect(await screen.findByText("Card:Fresh Story")).toBeInTheDocument();

    // Same "latest" article as what's already displayed — a second focus
    // shouldn't treat it as new again.
    window.dispatchEvent(new Event("focus"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText("New articles available")).not.toBeInTheDocument();
  });
});
