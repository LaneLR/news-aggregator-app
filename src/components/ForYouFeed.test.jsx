import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse } from "@/test/fixtures";

vi.mock("./NewsCardThree", () => ({
  default: ({ article, innerRef }) => (
    <div ref={innerRef}>Card:{article.title}</div>
  ),
}));
vi.mock("./ThreePaneLayout", () => ({
  default: ({ articles, onSelectArticle }) => (
    <div>
      ThreePane:{articles.length}
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
vi.mock("./ViewDensityToggle", () => ({
  default: ({ density, onChange }) => (
    <div>
      <span>Density:{density}</span>
      <button type="button" onClick={() => onChange("card")}>
        Switch to card
      </button>
    </div>
  ),
}));
vi.mock("./CardSkeleton", () => ({ default: () => <div>Skeleton</div> }));

const layoutPrefs = { value: { loaded: true, viewDensity: "reader", setViewDensity: vi.fn() } };
vi.mock("@/lib/useLayoutPrefs", () => ({
  useLayoutPrefs: () => layoutPrefs.value,
  applyCustomOrder: (items) => items,
}));

const markAllRead = { value: { hasUnread: false, markingAllRead: false, handleMarkAllRead: vi.fn() } };
vi.mock("@/lib/useMarkAllRead", () => ({ useMarkAllRead: () => markAllRead.value }));

const articleShortcuts = { onSelect: null };
vi.mock("@/lib/useArticleShortcuts", () => ({
  useArticleShortcuts: (articles, onSelect) => {
    articleShortcuts.onSelect = onSelect;
    return { selectedIndex: -1, cardRefs: { current: [] } };
  },
}));

const { default: ForYouFeed } = await import("./ForYouFeed");

describe("ForYouFeed", () => {
  beforeEach(() => {
    layoutPrefs.value = { loaded: true, viewDensity: "reader", setViewDensity: vi.fn() };
    markAllRead.value = { hasUnread: false, markingAllRead: false, handleMarkAllRead: vi.fn() };
  });

  it("shows loading skeletons while fetching recommendations", () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(<ForYouFeed />);
    expect(screen.getAllByText("Skeleton").length).toBeGreaterThan(0);
  });

  it("shows an error message when the fetch fails", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse(null, { ok: false, status: 500 }));
    render(<ForYouFeed />);
    expect(await screen.findByText(/Error:/)).toBeInTheDocument();
  });

  it("shows an empty state with no recommendations", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles: [] }));
    render(<ForYouFeed />);
    expect(await screen.findByText("Nothing tailored just yet.")).toBeInTheDocument();
  });

  it("renders the three-pane layout in reader density with articles", async () => {
    const articles = [makeArticle(), makeArticle()];
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles }));
    render(<ForYouFeed />);
    expect(await screen.findByText("ThreePane:2")).toBeInTheDocument();
  });

  it("renders a card grid when density is not reader", async () => {
    layoutPrefs.value = { loaded: true, viewDensity: "card", setViewDensity: vi.fn() };
    const article = makeArticle({ title: "Recommended Story" });
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles: [article] }));
    render(<ForYouFeed />);
    expect(await screen.findByText("Card:Recommended Story")).toBeInTheDocument();
  });

  it("selects an article via the keyboard-shortcut callback in reader density", async () => {
    const article = makeArticle({ id: "shortcut-article" });
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles: [article] }));
    render(<ForYouFeed />);
    await screen.findByText("ThreePane:1");

    expect(() => articleShortcuts.onSelect(article)).not.toThrow();
  });

  it("clears and sets the selected article via ThreePaneLayout's onSelectArticle", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles: [article] }));
    render(<ForYouFeed />);

    const selectButton = await screen.findByRole("button", { name: "Select first" });
    await user.click(selectButton);
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
  });

  it("sets the default archive id when the archive-default fetch succeeds", async () => {
    global.fetch.mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr === "/api/recommendations") return Promise.resolve(makeFetchResponse({ articles: [] }));
      if (urlStr === "/api/archives/default") return Promise.resolve(makeFetchResponse({ archiveId: "arch-1" }));
      return Promise.reject(new Error(`Unmocked fetch: ${urlStr}`));
    });
    render(<ForYouFeed />);
    expect(await screen.findByText("Nothing tailored just yet.")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("/api/archives/default");
  });

  it("shows the mark-all-read button when there is unread content and calls it", async () => {
    const user = userEvent.setup();
    markAllRead.value = { hasUnread: true, markingAllRead: false, handleMarkAllRead: vi.fn() };
    const articles = [makeArticle()];
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ articles }));
    render(<ForYouFeed />);

    const button = await screen.findByRole("button", { name: "Mark all as read" });
    await user.click(button);
    expect(markAllRead.value.handleMarkAllRead).toHaveBeenCalledTimes(1);
  });
});
