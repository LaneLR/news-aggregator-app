import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
  default: ({ article }) => <div data-testid="card">{article.title}</div>,
}));
vi.mock("./ThreePaneLayout", () => ({
  default: ({ articles }) => (
    <div data-testid="three-pane">
      {articles.map((a) => (
        <div key={a.url} data-testid="card">
          {a.title}
        </div>
      ))}
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
vi.mock("@/lib/useArticleShortcuts", () => ({
  useArticleShortcuts: () => ({ selectedIndex: -1, cardRefs: mockCardRefs }),
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
function triggerIntersection() {
  observerCallback([{ isIntersecting: true }]);
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
    triggerIntersection();

    expect(await screen.findByText("Page Two Article")).toBeInTheDocument();
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
    triggerIntersection();

    expect(await screen.findByText("New Article", {}, { timeout: 3000 })).toBeInTheDocument();
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

  it("falls back a gated density (list/magazine) to 'card' for a non-subscribed user", async () => {
    mockSession = makeSession({ tier: "Free" });
    mockViewDensity = "list";
    global.fetch.mockResolvedValueOnce(
      resultsPage([{ url: "https://example.com/1", title: "Gated Density Test", id: "1" }])
    );
    render(<SearchFeed initialQuery="nvidia" />);

    await screen.findByText("Gated Density Test");
    // Reader density would render ThreePaneLayout; card/list/magazine render
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
    triggerIntersection();

    expect(await screen.findByText("No more results")).toBeInTheDocument();
  });

  it("logs and stops pagination if the search request throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error("network down"));
    render(<SearchFeed initialQuery="nvidia" />);

    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(await screen.findByText('No results found for "nvidia".')).toBeInTheDocument();
  });
});
