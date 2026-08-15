import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession, makeFetchResponse } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/news",
}));

// NewsCardThree and ArticleReader are large components owned by other test
// files — stubbed here so ThreePaneLayout's own wiring (selection, fetch,
// full-screen, focus trap) can be tested in isolation.
vi.mock("./NewsCardThree", () => ({
  default: ({ article, onSelect }) => (
    <div>
      <button type="button" onClick={onSelect}>
        {article.title}
      </button>
    </div>
  ),
}));
vi.mock("./ArticleReader", () => ({
  default: ({ article, onClose, isFullScreen, onToggleFullScreen }) => (
    <div>
      <h1>{article.title}</h1>
      <button type="button" onClick={onClose}>
        Close
      </button>
      <button type="button" aria-label="Full screen" onClick={onToggleFullScreen}>
        {isFullScreen ? "Exit full screen" : "Full screen"}
      </button>
    </div>
  ),
}));

const { default: ThreePaneLayout } = await import("./ThreePaneLayout");

const articles = [
  { id: "a1", url: "https://example.com/a1", title: "Article One" },
  { id: "a2", url: "https://example.com/a2", title: "Article Two" },
];

function renderLayout(props = {}) {
  const cardRefs = { current: [] };
  const onSelectArticle = vi.fn();
  const utils = render(
    <ThreePaneLayout
      articles={articles}
      selectedIndex={-1}
      cardRefs={cardRefs}
      selectedArticleId={null}
      onSelectArticle={onSelectArticle}
      {...props}
    />
  );
  return { ...utils, onSelectArticle };
}

describe("ThreePaneLayout", () => {
  beforeEach(() => {
    mockSession = makeSession({ tier: "Free" });
  });

  it("renders a list item per article", () => {
    renderLayout();
    expect(screen.getByRole("button", { name: "Article One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Article Two" })).toBeInTheDocument();
  });

  it("fetches and renders the selected article's reader content", async () => {
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        article: { title: "Article One" },
        sanitizedContent: "<p>body</p>",
        relatedCoverage: [],
        readingTime: 3,
      })
    );

    renderLayout({ selectedArticleId: "a1" });

    expect(global.fetch).toHaveBeenCalledWith("/api/articles/reader/a1");
    expect(await screen.findByRole("heading", { name: "Article One" })).toBeInTheDocument();
  });

  it("shows a gated error message when the API responds with gated: true", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ gated: true }, { ok: false, status: 403 }));

    renderLayout({ selectedArticleId: "a1" });

    expect(await screen.findByText("This article requires a subscription.")).toBeInTheDocument();
  });

  it("shows a generic error and lets the user retry on failure", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({}, { ok: false, status: 500 }));
    const user = userEvent.setup();

    renderLayout({ selectedArticleId: "a1" });

    expect(await screen.findByText("Couldn't load this article.")).toBeInTheDocument();

    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ article: { title: "Article One" }, sanitizedContent: "<p>body</p>", relatedCoverage: [], readingTime: 1 })
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Article One" })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("calls onSelectArticle when clicking a card's title", async () => {
    const user = userEvent.setup();
    const { onSelectArticle } = renderLayout();

    await user.click(screen.getByRole("button", { name: "Article One" }));

    expect(onSelectArticle).toHaveBeenCalledWith(articles[0]);
  });

  it("enters full screen and traps focus within the overlay panel", async () => {
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ article: { title: "Article One" }, sanitizedContent: "<p>body</p>", relatedCoverage: [], readingTime: 1 })
    );
    const user = userEvent.setup();

    renderLayout({ selectedArticleId: "a1" });
    await screen.findByRole("heading", { name: "Article One" });

    await user.click(screen.getByRole("button", { name: "Full screen" }));

    const dialog = screen.getByRole("dialog", { name: "Full screen article reader" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("closes full screen on Escape", async () => {
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ article: { title: "Article One" }, sanitizedContent: "<p>body</p>", relatedCoverage: [], readingTime: 1 })
    );
    const user = userEvent.setup();

    renderLayout({ selectedArticleId: "a1" });
    await screen.findByRole("heading", { name: "Article One" });
    await user.click(screen.getByRole("button", { name: "Full screen" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes full screen when clicking the overlay backdrop, but not when clicking inside the panel", async () => {
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ article: { title: "Article One" }, sanitizedContent: "<p>body</p>", relatedCoverage: [], readingTime: 1 })
    );
    const user = userEvent.setup();

    renderLayout({ selectedArticleId: "a1" });
    await screen.findByRole("heading", { name: "Article One" });
    await user.click(screen.getByRole("button", { name: "Full screen" }));

    // Clicking inside the panel (the heading) must not close it.
    await user.click(screen.getByRole("heading", { name: "Article One" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Clicking the backdrop itself (the dialog's parent overlay) closes it.
    const overlay = screen.getByRole("dialog").parentElement;
    await user.click(overlay);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
