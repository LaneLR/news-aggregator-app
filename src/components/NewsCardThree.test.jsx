import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
const push = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const { default: NewsCardThree } = await import("./NewsCardThree");

function mockRoutes(routes) {
  global.fetch.mockImplementation((url, opts) => {
    const urlStr = url.toString();
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? urlStr === matcher : matcher.test(urlStr);
      if (matches) return Promise.resolve(handler(opts));
    }
    return Promise.reject(new Error(`Unmocked fetch: ${urlStr}`));
  });
}

const ARCHIVE_ROUTES = [
  ["/api/archives", () => makeFetchResponse({ archives: [] })],
  [/\/api\/articles\/check/, () => makeFetchResponse({ saved: false })],
];

describe("NewsCardThree", () => {
  beforeEach(() => {
    mockSession = null;
    push.mockClear();
    toast.info.mockClear();
    toast.error.mockClear();
    mockRoutes(ARCHIVE_ROUTES);
  });

  it("eagerly loads only the first few cards by index, lazy-loading the rest", () => {
    const article = makeArticle({ title: "Big News Story" });

    // A preloaded next/image omits the `loading` attribute entirely rather
    // than setting loading="eager" — its absence, contrasted with the
    // explicit "lazy" below, is what distinguishes the two states here.
    const { unmount } = render(<NewsCardThree article={article} viewOnly index={0} />);
    expect(screen.getByAltText("Big News Story")).not.toHaveAttribute("loading");
    unmount();

    render(<NewsCardThree article={article} viewOnly index={4} />);
    expect(screen.getByAltText("Big News Story")).toHaveAttribute("loading", "lazy");
  });

  it("renders the article title and source", () => {
    const article = makeArticle({ title: "Big News Story", sourceName: "Example News" });
    render(<NewsCardThree article={article} viewOnly />);
    expect(screen.getByText("Big News Story")).toBeInTheDocument();
    expect(screen.getByText("Example News")).toBeInTheDocument();
  });

  it("shows a recommendation reason when present", () => {
    const article = makeArticle({ recommendationReason: "Because you liked Tech news" });
    render(<NewsCardThree article={article} viewOnly />);
    expect(screen.getByText("Because you liked Tech news")).toBeInTheDocument();
  });

  it("shows a lock icon for paywalled sources", () => {
    const article = makeArticle({ sourceName: "Bloomberg" });
    render(<NewsCardThree article={article} viewOnly />);
    expect(screen.getByTitle(/may be behind a paywall/i)).toBeInTheDocument();
  });

  it("redirects to login and shows a toast when liking while logged out", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    render(<NewsCardThree article={article} viewOnly />);

    await user.click(screen.getByRole("button", { name: /like this article/i }));

    expect(toast.info).toHaveBeenCalledWith("Sign in to like articles.");
    expect(push).toHaveBeenCalledWith("/login");
  });

  it("likes the article when logged in", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    const article = makeArticle({ likeCount: 0 });
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/like", () => makeFetchResponse({ success: true })]]);
    render(<NewsCardThree article={article} viewOnly />);

    await user.click(screen.getByRole("button", { name: /like this article/i }));

    expect(screen.getByRole("button", { name: /unlike this article/i })).toHaveTextContent("1");
  });

  it("shows a selection checkbox and calls onToggleSelect when in selection mode", async () => {
    const user = userEvent.setup();
    const onToggleSelect = vi.fn();
    const article = makeArticle();
    render(
      <NewsCardThree
        article={article}
        viewOnly
        selectionMode
        isSelected={false}
        onToggleSelect={onToggleSelect}
      />
    );

    // The image link's onClick intercepts the click while selectionMode is on.
    const link = document.querySelector('a[href="' + article.url + '"]');
    await user.click(link);

    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect instead of navigating when onSelect is provided", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const article = makeArticle();
    render(<NewsCardThree article={article} viewOnly onSelect={onSelect} />);

    const titleLink = screen.getByText(article.title);
    await user.click(titleLink);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("applies the densityList class when density='list'", () => {
    const article = makeArticle();
    const { container } = render(<NewsCardThree article={article} viewOnly density="list" />);
    expect(container.querySelector('[class*="densityList"]')).toBeInTheDocument();
  });

  it("applies the keyboardFocused class when isKeyboardFocused is true", () => {
    const article = makeArticle();
    const { container } = render(<NewsCardThree article={article} viewOnly isKeyboardFocused />);
    expect(container.querySelector('[class*="keyboardFocused"]')).toBeInTheDocument();
  });

  it("unlikes an already-liked article and decrements the count", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    const article = makeArticle({ isLikedByUser: true, likeCount: 3 });
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/like", () => makeFetchResponse({ success: true })]]);
    render(<NewsCardThree article={article} viewOnly />);

    await user.click(screen.getByRole("button", { name: /unlike this article/i }));

    expect(screen.getByRole("button", { name: /like this article/i })).toHaveTextContent("2");
  });

  it("rolls back the like count and shows an error toast when the like request fails", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    const article = makeArticle({ isLikedByUser: false, likeCount: 5 });
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/like", () => makeFetchResponse(null, { ok: false, status: 500 })]]);
    render(<NewsCardThree article={article} viewOnly />);

    await user.click(screen.getByRole("button", { name: /like this article/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /like this article/i })).toHaveTextContent("5")
    );
    expect(toast.error).toHaveBeenCalledWith("Couldn't update like status. Please try again.");
  });

  it("swaps to the category-colored fallback art when the thumbnail fails to load", async () => {
    // makeArticle defaults to category: ["Business"] (see src/test/fixtures.js).
    const article = makeArticle({ urlToImage: "https://example.com/broken.jpg" });
    const { container } = render(<NewsCardThree article={article} viewOnly />);
    // Let ArchiveToggleButton's own mount-time fetches settle before
    // triggering more state updates, to avoid an unrelated act() warning.
    await screen.findByRole("button", { name: "Save to archive" });

    // next/image rewrites `src` through its own /_next/image optimizer, so
    // the original URL shows up URL-encoded inside the `url=` query param
    // rather than as a direct substring.
    const img = screen.getByAltText(article.title);
    expect(img.src).toContain(encodeURIComponent("/api/image-proxy"));

    fireEvent.error(img);

    expect(screen.queryByAltText(article.title)).not.toBeInTheDocument();
    expect(container.querySelector('[style*="linear-gradient"]')).toBeInTheDocument();
  });

  it("renders the category-colored fallback art with the headline overlaid when there's no urlToImage at all", () => {
    const article = makeArticle({ urlToImage: null, category: ["Entertainment"], title: "No Image Article" });
    const { container } = render(<NewsCardThree article={article} viewOnly />);

    expect(screen.queryByAltText("No Image Article")).not.toBeInTheDocument();
    const art = container.querySelector('[style*="linear-gradient"]');
    expect(art).toBeInTheDocument();
    expect(art.style.background).toContain("rgb(219, 39, 119)"); // Entertainment: #db2777
    // Headline appears as the fallback art's overlay, in addition to its
    // normal spot below — see ArticleFallbackArt.jsx for why it isn't
    // deduplicated (the below-image title is a distinct link, to the
    // in-app reader, not just decoration).
    expect(screen.getAllByText("No Image Article").length).toBeGreaterThan(0);
  });

  it("falls back to the generic color for an article with no category", () => {
    const article = makeArticle({ urlToImage: null, category: [] });
    const { container } = render(<NewsCardThree article={article} viewOnly />);

    const art = container.querySelector('[style*="linear-gradient"]');
    expect(art.style.background).toContain("rgb(51, 65, 85)"); // default: #334155
  });

  it("swiping right past the threshold triggers the save action on the card", async () => {
    const article = makeArticle();
    const { container } = render(<NewsCardThree article={article} viewOnly />);
    const wrapper = container.firstChild;

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 0 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper);

    const saveButton = screen.getByRole("button", { name: "Save to archive" });
    await waitFor(() => expect(saveButton).toHaveAttribute("aria-expanded", "true"));
  });

  it("swiping left past the threshold marks the article read when signed in", async () => {
    mockSession = makeSession();
    const article = makeArticle({ isRead: false });
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/mark-all-read", () => makeFetchResponse({ success: true })]]);
    const { container } = render(<NewsCardThree article={article} viewOnly />);
    const wrapper = container.firstChild;

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/articles/mark-all-read",
        expect.objectContaining({ body: JSON.stringify({ urls: [article.url] }) })
      )
    );
  });

  it("swiping left does nothing when signed out", () => {
    const article = makeArticle({ isRead: false });
    const { container } = render(<NewsCardThree article={article} viewOnly />);
    const wrapper = container.firstChild;

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper);

    expect(global.fetch).not.toHaveBeenCalledWith("/api/articles/mark-all-read", expect.anything());
  });

  it("swiping left does nothing when the article is already read", () => {
    mockSession = makeSession();
    const article = makeArticle({ isRead: true });
    const { container } = render(<NewsCardThree article={article} viewOnly />);
    const wrapper = container.firstChild;

    fireEvent.touchStart(wrapper, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper);

    expect(global.fetch).not.toHaveBeenCalledWith("/api/articles/mark-all-read", expect.anything());
  });

  it("tracks a click on the 'Read article' link", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    render(<NewsCardThree article={article} viewOnly />);

    // trackArticleClick posts to /api/articles/click fire-and-forget; just
    // confirm the link is wired and clicking doesn't throw.
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/click", () => makeFetchResponse({ success: true })]]);
    await user.click(screen.getByRole("link", { name: "Read article" }));

    expect(screen.getByRole("link", { name: "Read article" })).toHaveAttribute("href", article.url);
  });

  it("renders without a category-color top border when the article has no category", () => {
    const article = makeArticle({ category: [] });
    const { container } = render(<NewsCardThree article={article} viewOnly />);
    const card = container.querySelector('[class*="cardContainer"]');
    expect(card.style.borderTopWidth).toBe("");
  });
});
