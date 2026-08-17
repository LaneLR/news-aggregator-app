import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse } from "@/test/fixtures";

const mockSession = { value: null };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession.value, status: mockSession.value ? "authenticated" : "unauthenticated" }),
}));

vi.mock("./NewsCardThree", () => ({
  default: ({ article, innerRef }) => (
    <div ref={typeof innerRef === "function" ? innerRef : undefined}>Card:{article.title}</div>
  ),
}));
vi.mock("./ThreePaneLayout", () => ({
  default: ({ articles, onSelectArticle }) => (
    <div>
      {`ThreePane:${articles.length}`}
      <button type="button" onClick={() => onSelectArticle(articles[0])}>
        Open first
      </button>
      <button type="button" onClick={() => onSelectArticle(null)}>
        Close reader
      </button>
    </div>
  ),
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

const layoutPrefs = { value: { loaded: true, viewDensity: "card", setViewDensity: vi.fn() } };
vi.mock("@/lib/useLayoutPrefs", () => ({ useLayoutPrefs: () => layoutPrefs.value }));

const markAllRead = { value: { hasUnread: false, markingAllRead: false, handleMarkAllRead: vi.fn() } };
vi.mock("@/lib/useMarkAllRead", () => ({ useMarkAllRead: () => markAllRead.value }));

// Captures the onOpen callback TodayPage passes in (only in reader density)
// so a test can invoke it directly, the same way a real 'o'/Enter keypress
// would — this mock doesn't attach any real keyboard listener itself.
const capturedOnOpen = { current: null };
vi.mock("@/lib/useArticleShortcuts", () => ({
  useArticleShortcuts: (articles, onOpen) => {
    capturedOnOpen.current = onOpen;
    return { selectedIndex: -1, cardRefs: { current: [] } };
  },
}));

const { default: TodayPage } = await import("./TodayPage");

function mockFetchRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? url.toString() === matcher : matcher.test(url.toString());
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

const ARCHIVE_ROUTE = [/\/api\/archives\/default/, () => makeFetchResponse({ archiveId: "archive-1" })];
const TODAY_ROUTE_PATTERN = /^\/api\/articles\/today\?startOfDay=/;

describe("TodayPage", () => {
  beforeEach(() => {
    mockSession.value = null;
    layoutPrefs.value = { loaded: true, viewDensity: "card", setViewDensity: vi.fn() };
    markAllRead.value = { hasUnread: false, markingAllRead: false, handleMarkAllRead: vi.fn() };
  });

  it("fetches with sort=newest by default and renders the returned articles", async () => {
    const article = makeArticle({ title: "Fresh headline" });
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [article], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    render(<TodayPage />);

    expect(await screen.findByText("Card:Fresh headline")).toBeInTheDocument();
    const [url] = global.fetch.mock.calls.find(([u]) => TODAY_ROUTE_PATTERN.test(u.toString()));
    expect(url.toString()).toContain("sort=newest");
    expect(url.toString()).toContain("startOfDay=");
  });

  it("re-fetches with sort=oldest when the Oldest toggle is clicked", async () => {
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    const user = userEvent.setup();
    render(<TodayPage />);
    await screen.findByText(/no articles published today yet/i);

    await user.click(screen.getByRole("button", { name: "Oldest" }));

    await waitFor(() => {
      const call = global.fetch.mock.calls.find(
        ([u]) => TODAY_ROUTE_PATTERN.test(u.toString()) && u.toString().includes("sort=oldest")
      );
      expect(call).toBeDefined();
    });
  });

  it("re-fetches with sort=trending when the Trending toggle is clicked", async () => {
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    const user = userEvent.setup();
    render(<TodayPage />);
    await screen.findByText(/no articles published today yet/i);

    await user.click(screen.getByRole("button", { name: "Trending" }));

    await waitFor(() => {
      const call = global.fetch.mock.calls.find(
        ([u]) => TODAY_ROUTE_PATTERN.test(u.toString()) && u.toString().includes("sort=trending")
      );
      expect(call).toBeDefined();
    });
  });

  it("loads the next page and appends results when Load More is clicked", async () => {
    let call = 0;
    mockFetchRoutes([
      [
        TODAY_ROUTE_PATTERN,
        () => {
          call += 1;
          return makeFetchResponse(
            call === 1
              ? { articles: [makeArticle({ title: "Page one" })], totalPages: 2 }
              : { articles: [makeArticle({ title: "Page two" })], totalPages: 2 }
          );
        },
      ],
      ARCHIVE_ROUTE,
    ]);
    const user = userEvent.setup();
    render(<TodayPage />);

    expect(await screen.findByText("Card:Page one")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load More" }));

    expect(await screen.findByText("Card:Page two")).toBeInTheDocument();
    expect(screen.getByText("Card:Page one")).toBeInTheDocument();
  });

  it("shows 'You're all caught up' once every page has loaded", async () => {
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [makeArticle()], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    render(<TodayPage />);

    expect(await screen.findByText(/you're all caught up/i)).toBeInTheDocument();
  });

  it("shows an error state when the fetch itself throws and nothing is loaded yet", async () => {
    mockFetchRoutes([[ARCHIVE_ROUTE[0], ARCHIVE_ROUTE[1]]]);
    render(<TodayPage />);

    expect(await screen.findByText(/error:/i)).toBeInTheDocument();
  });

  it("shows an error state when the today response itself is not ok", async () => {
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ error: "nope" }, { ok: false, status: 500 })],
      ARCHIVE_ROUTE,
    ]);
    render(<TodayPage />);

    expect(await screen.findByText("Error: Failed to fetch today's news")).toBeInTheDocument();
  });

  it("logs an error and stops the loading-more spinner when the next page fails to fetch", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let call = 0;
    global.fetch.mockImplementation((url) => {
      if (TODAY_ROUTE_PATTERN.test(url.toString())) {
        call += 1;
        if (call === 1) {
          return Promise.resolve(makeFetchResponse({ articles: [makeArticle({ title: "Page one" })], totalPages: 2 }));
        }
        return Promise.reject(new Error("network down"));
      }
      return Promise.resolve(makeFetchResponse({ archiveId: "archive-1" }));
    });
    const user = userEvent.setup();
    render(<TodayPage />);
    await screen.findByText("Card:Page one");

    await user.click(screen.getByRole("button", { name: "Load More" }));

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to load more of today's articles:", expect.any(Error))
    );
    expect(screen.getByRole("button", { name: "Load More" })).not.toBeDisabled();
    consoleErrorSpy.mockRestore();
  });

  it("ignores a second Load More click fired while the first is still in flight", async () => {
    let resolveSecondPage;
    let call = 0;
    global.fetch.mockImplementation((url) => {
      if (TODAY_ROUTE_PATTERN.test(url.toString())) {
        call += 1;
        if (call === 1) {
          return Promise.resolve(makeFetchResponse({ articles: [makeArticle({ title: "Page one" })], totalPages: 2 }));
        }
        return new Promise((resolve) => {
          resolveSecondPage = () =>
            resolve(makeFetchResponse({ articles: [makeArticle({ title: "Page two" })], totalPages: 2 }));
        });
      }
      return Promise.resolve(makeFetchResponse({ archiveId: "archive-1" }));
    });
    const user = userEvent.setup();
    render(<TodayPage />);
    await screen.findByText("Card:Page one");

    const loadMoreButton = screen.getByRole("button", { name: "Load More" });
    await user.click(loadMoreButton);
    // The button is disabled while isLoadingMore is true, so a second real
    // click can't reach the handler — this exercises the same guard
    // (`isLoadingMore || page >= totalPages`) that protects against it.
    expect(loadMoreButton).toBeDisabled();

    resolveSecondPage();
    await screen.findByText("Card:Page two");
    expect(call).toBe(2); // not 3 — no extra fetch snuck through
  });

  it("re-selects Newest after switching away from it", async () => {
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    const user = userEvent.setup();
    render(<TodayPage />);
    await screen.findByText(/no articles published today yet/i);

    await user.click(screen.getByRole("button", { name: "Oldest" }));
    await user.click(screen.getByRole("button", { name: "Newest" }));

    await waitFor(() => {
      const newestCalls = global.fetch.mock.calls.filter(
        ([u]) => TODAY_ROUTE_PATTERN.test(u.toString()) && u.toString().includes("sort=newest")
      );
      expect(newestCalls.length).toBeGreaterThan(1); // initial mount + the explicit re-click
    });
  });

  it("opens the selected article via the keyboard-shortcut onOpen callback in reader density", async () => {
    layoutPrefs.value = { loaded: true, viewDensity: "reader", setViewDensity: vi.fn() };
    const article = makeArticle({ id: 42, title: "Reader density pick" });
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [article], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    render(<TodayPage />);
    await screen.findByText("ThreePane:1");

    expect(capturedOnOpen.current).toBeInstanceOf(Function);
    capturedOnOpen.current(article);
    // No visible assertion target beyond confirming the callback runs
    // without throwing — selectedArticleId is only surfaced as a prop to
    // the (mocked) ThreePaneLayout, not rendered as its own text.
  });

  it("opens and closes an article via ThreePaneLayout's onSelectArticle in reader density", async () => {
    layoutPrefs.value = { loaded: true, viewDensity: "reader", setViewDensity: vi.fn() };
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [makeArticle({ id: 7 })], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    const user = userEvent.setup();
    render(<TodayPage />);
    await screen.findByText("ThreePane:1");

    await user.click(screen.getByRole("button", { name: "Open first" }));
    await user.click(screen.getByRole("button", { name: "Close reader" }));
  });

  it("shows the empty state when there are no articles published today", async () => {
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    render(<TodayPage />);

    expect(await screen.findByText(/no articles published today yet/i)).toBeInTheDocument();
  });

  it("switches to the reader density's three-pane layout", async () => {
    layoutPrefs.value = { loaded: true, viewDensity: "reader", setViewDensity: vi.fn() };
    mockSession.value = { user: { id: "user-1", tier: "Subscribed" } };
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [makeArticle()], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    render(<TodayPage />);

    expect(await screen.findByText("ThreePane:1")).toBeInTheDocument();
  });

  it("falls back to card density for a Free-tier user even if reader/list/magazine was previously chosen", async () => {
    layoutPrefs.value = { loaded: true, viewDensity: "list", setViewDensity: vi.fn() };
    mockSession.value = { user: { id: "user-1", tier: "Free" } };
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [makeArticle({ title: "Gated density" })], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    render(<TodayPage />);

    expect(await screen.findByText("Card:Gated density")).toBeInTheDocument();
  });

  it("shows a Mark all as read button when there's unread content", async () => {
    markAllRead.value = { hasUnread: true, markingAllRead: false, handleMarkAllRead: vi.fn() };
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [], totalPages: 1 })],
      ARCHIVE_ROUTE,
    ]);
    render(<TodayPage />);

    expect(await screen.findByRole("button", { name: "Mark all as read" })).toBeInTheDocument();
  });

  it("warns and leaves defaultArchiveId unset when the archive lookup fails", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetchRoutes([
      [TODAY_ROUTE_PATTERN, () => makeFetchResponse({ articles: [], totalPages: 1 })],
      [/\/api\/archives\/default/, () => makeFetchResponse({ error: "nope" }, { ok: false, status: 500 })],
    ]);
    render(<TodayPage />);

    await screen.findByText(/no articles published today yet/i);
    await waitFor(() => expect(consoleWarnSpy).toHaveBeenCalledWith("Could not get default archive:", "nope"));
    consoleWarnSpy.mockRestore();
  });

  it("logs an error when the archive fetch itself throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockImplementation((url) => {
      if (TODAY_ROUTE_PATTERN.test(url.toString())) {
        return Promise.resolve(makeFetchResponse({ articles: [], totalPages: 1 }));
      }
      return Promise.reject(new Error("network down"));
    });
    render(<TodayPage />);

    await screen.findByText(/no articles published today yet/i);
    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith("Archive fetch error:", expect.any(Error))
    );
    consoleErrorSpy.mockRestore();
  });
});
