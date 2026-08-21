import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession, makeFetchResponse } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// SearchFeed composes several heavier components/hooks that belong to other
// files/scopes — stubbed here so this file only exercises SearchFeed's own
// fetch/pagination/density-gating logic.
vi.mock("./NewsGridWrapper", () => ({
  default: ({ children }) => <div data-testid="grid">{children}</div>,
}));
vi.mock("./NewsCardThree", () => ({
  default: ({ article, innerRef }) => (
    <div ref={innerRef} data-testid="card">
      {article.title}
    </div>
  ),
}));
vi.mock("./ThreePaneLayout", () => ({
  default: ({ articles, onSelectArticle }) => (
    <div data-testid="three-pane">
      {articles.map((a) => (
        <div key={a.url} data-testid="card">
          {a.title}
        </div>
      ))}
      <button type="button" onClick={() => onSelectArticle(articles[0])}>
        Select first
      </button>
      <button type="button" onClick={() => onSelectArticle(null)}>
        Clear selection
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
vi.mock("./CardSkeleton", () => ({
  default: () => <div data-testid="skeleton" />,
}));

const setViewDensity = vi.fn();
let mockViewDensity = "card";
vi.mock("@/lib/useLayoutPrefs", () => ({
  useLayoutPrefs: () => ({ viewDensity: mockViewDensity, setViewDensity }),
}));

const mockCardRefs = { current: [] };
const articleShortcuts = { onSelect: null };
vi.mock("@/lib/useArticleShortcuts", () => ({
  useArticleShortcuts: (articles, onSelect) => {
    articleShortcuts.onSelect = onSelect;
    return { selectedIndex: -1, cardRefs: mockCardRefs };
  },
}));

const mockHandleMarkAllRead = vi.fn();
let mockHasUnread = false;
vi.mock("@/lib/useMarkAllRead", () => ({
  useMarkAllRead: (articles, setArticles) => ({
    hasUnread: mockHasUnread,
    markingAllRead: false,
    handleMarkAllRead: () => {
      mockHandleMarkAllRead();
      setArticles((prev) => prev.map((a) => ({ ...a, isRead: true })));
    },
  }),
}));

const { default: SearchFeed } = await import("./SearchFeed");

function resultsPage(articles) {
  return makeFetchResponse({ results: articles });
}

// jsdom has no real IntersectionObserver — vitest.setup.js stubs a minimal
// one globally, but it doesn't expose the registered callback. Overriding
// it here (module scope runs after setup) lets pagination tests simulate
// the sentinel scrolling into view.
let observerCallback;
class CapturingObserver {
  constructor(cb) {
    observerCallback = cb;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.IntersectionObserver = CapturingObserver;
async function triggerIntersection() {
  // The real IntersectionObserver callback fires outside of any React event
  // handler, so calling it directly here needs the same act() wrapping —
  // without it, the resulting setPage() update isn't guaranteed to be
  // flushed before the next line of the test runs, leaving it to chance
  // (and to how many polling cycles a given findBy* happens to need)
  // whether the update lands in time. The async form (awaited, callback
  // itself async) matters specifically here: setPage's synchronous update
  // is what re-triggers SearchFeed's fetch effect, and that effect's first
  // line is another state update (setLoading(true)) — a plain sync act()
  // only guarantees React flushes up to that point, not the microtask
  // queue beyond it, which was enough to occasionally leave `loading`
  // still true from the *previous* fetch when the assertion below ran.
  await act(async () => {
    observerCallback([{ isIntersecting: true }]);
  });
}

describe("SearchFeed", () => {
  beforeEach(() => {
    mockSession = makeSession({ tier: "Free" });
    mockViewDensity = "card";
    mockHasUnread = false;
    setViewDensity.mockClear();
    mockHandleMarkAllRead.mockClear();
  });

  it("shows the query in the header subtitle", async () => {
    global.fetch.mockResolvedValueOnce(resultsPage([]));
    render(<SearchFeed initialQuery="nvidia" />);
    expect(screen.getByText('Showing results for "nvidia"')).toBeInTheDocument();
  });

  it("shows skeleton cards while the first page is loading", () => {
    global.fetch.mockReturnValueOnce(new Promise(() => {}));
    render(<SearchFeed initialQuery="nvidia" />);
    expect(screen.getAllByTestId("skeleton").length).toBe(6);
  });

  it("fetches page 1 for the initial query and renders results as cards", async () => {
    global.fetch.mockResolvedValueOnce(
      resultsPage([
        { url: "https://example.com/1", title: "NVIDIA earnings beat", id: "1" },
        { url: "https://example.com/2", title: "NVIDIA new chip", id: "2" },
      ])
    );
    render(<SearchFeed initialQuery="nvidia" />);

    expect(global.fetch).toHaveBeenCalledWith("/api/search?query=nvidia&page=1");
    expect(await screen.findByText("NVIDIA earnings beat")).toBeInTheDocument();
    expect(screen.getByText("NVIDIA new chip")).toBeInTheDocument();
  });

  it("shows the empty state when there are no results and no more pages", async () => {
    global.fetch.mockResolvedValueOnce(resultsPage([]));
    render(<SearchFeed initialQuery="zzz-nonexistent" />);

    expect(await screen.findByText('No results found for "zzz-nonexistent".')).toBeInTheDocument();
  });

  it("loads the next page when the sentinel intersects, appending new articles", async () => {
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Page One Article", id: "1" }])
    );
    render(<SearchFeed initialQuery="nvidia" />);
    await screen.findByText("Page One Article");

    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/2", title: "Page Two Article", id: "2" }])
    );
    await triggerIntersection();

    // Same extended timeout as the "deduplicates" test right below, which
    // has this identical render-page-1 / trigger-intersection / assert
    // shape — under heavy full-suite parallel load, the fetch/render cycle
    // (correct, but genuinely async: mocked fetch resolves, then setResults,
    // then a React re-render/commit) can take longer wall-clock time than a
    // CPU-starved test runner's default polling window, even though nothing
    // is actually broken. 1000ms wasn't enough; 3000ms still intermittently
    // wasn't enough under real full-suite CI load (confirmed reproducing
    // 2026-08-18) — bumped further rather than re-bumping by small
    // increments each time this resurfaces.
    expect(await screen.findByText("Page Two Article", {}, { timeout: 8000 })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith("/api/search?query=nvidia&page=2");
  });

  it("deduplicates newly-fetched articles against ones already shown, by URL", async () => {
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Same Article", id: "1" }])
    );
    render(<SearchFeed initialQuery="dup" />);
    await screen.findByText("Same Article");

    // A next page that (as real APIs sometimes do near a boundary) repeats
    // an already-seen URL alongside a genuinely new one.
    global.fetch.mockResolvedValueOnce(
      resultsPage([
        { url: "https://example.com/1", title: "Same Article", id: "1" },
        { url: "https://example.com/3", title: "New Article", id: "3" },
      ])
    );
    await triggerIntersection();

    expect(await screen.findByText("New Article", {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getAllByText("Same Article")).toHaveLength(1);
  });

  it("shows a Mark all as read button only when there are unread results, and calls the handler", async () => {
    mockHasUnread = true;
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Unread Article", id: "1", isRead: false }])
    );
    const user = userEvent.setup();
    render(<SearchFeed initialQuery="nvidia" />);
    await screen.findByText("Unread Article");

    const button = screen.getByRole("button", { name: "Mark all as read" });
    await user.click(button);

    expect(mockHandleMarkAllRead).toHaveBeenCalled();
  });

  it("does not show Mark all as read when there is nothing unread", async () => {
    mockHasUnread = false;
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Read Article", id: "1", isRead: true }])
    );
    render(<SearchFeed initialQuery="nvidia" />);
    await screen.findByText("Read Article");

    expect(screen.queryByRole("button", { name: "Mark all as read" })).not.toBeInTheDocument();
  });

  it("falls back a gated density (list) to 'card' for a non-subscribed user", async () => {
    mockSession = makeSession({ tier: "Free" });
    mockViewDensity = "list";
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Gated Density Test", id: "1" }])
    );
    render(<SearchFeed initialQuery="nvidia" />);

    await screen.findByText("Gated Density Test");
    // Reader density would render ThreePaneLayout; card/list render
    // NewsGridWrapper + NewsCardThree — confirms it fell back off "list".
    expect(screen.getByTestId("grid")).toBeInTheDocument();
    expect(screen.queryByTestId("three-pane")).not.toBeInTheDocument();
  });

  it("renders the reader (3-pane) density for a session with viewDensity 'reader'", async () => {
    mockViewDensity = "reader";
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Reader Density Test", id: "1" }])
    );
    render(<SearchFeed initialQuery="nvidia" />);

    expect(await screen.findByTestId("three-pane")).toBeInTheDocument();
    expect(screen.getByText("Reader Density Test")).toBeInTheDocument();
  });

  it("stops paginating and shows 'No more results' once a page comes back empty", async () => {
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Only Result", id: "1" }])
    );
    render(<SearchFeed initialQuery="nvidia" />);
    await screen.findByText("Only Result");

    global.fetch.mockResolvedValueOnce(resultsPage([]));
    await triggerIntersection();

    expect(await screen.findByText("No more results", {}, { timeout: 8000 })).toBeInTheDocument();
  });

  it("selects an article via the keyboard-shortcut callback in reader density", async () => {
    mockViewDensity = "reader";
    const article = { url: "https://example.com/1", title: "Reader Density Test", id: "1" };
    global.fetch.mockResolvedValueOnce(resultsPage([article]));
    render(<SearchFeed initialQuery="nvidia" />);
    await screen.findByTestId("three-pane");

    expect(() => articleShortcuts.onSelect(article)).not.toThrow();
  });

  it("clears and sets the selected article via ThreePaneLayout's onSelectArticle", async () => {
    mockViewDensity = "reader";
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Reader Density Test", id: "1" }])
    );
    render(<SearchFeed initialQuery="nvidia" />);
    await screen.findByTestId("three-pane");

    await user.click(screen.getByRole("button", { name: "Select first" }));
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
  });

  it("logs and stops pagination if the search request throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error("network down"));
    render(<SearchFeed initialQuery="nvidia" />);

    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(await screen.findByText('No results found for "nvidia".')).toBeInTheDocument();
  });
});
