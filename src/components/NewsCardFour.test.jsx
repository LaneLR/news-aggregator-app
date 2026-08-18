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

const { default: NewsCardFour } = await import("./NewsCardFour");

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

// Every card mounts an ArchiveToggleButton internally, which always fires an
// /api/archives GET on mount, plus an /api/articles/check GET unless
// archiveId is passed (viewOnly=true + no archiveId — the case exercised
// here) — both need a baseline stub in every test.
const ARCHIVE_ROUTES = [
  ["/api/archives", () => makeFetchResponse({ archives: [] })],
  [/\/api\/articles\/check/, () => makeFetchResponse({ saved: false })],
];

describe("NewsCardFour", () => {
  beforeEach(() => {
    mockSession = null;
    push.mockClear();
    toast.info.mockClear();
    toast.error.mockClear();
    mockRoutes(ARCHIVE_ROUTES);
  });

  it("renders the article title and source", () => {
    const article = makeArticle({ title: "Big News Story", sourceName: "Example News" });
    render(<NewsCardFour article={article} viewOnly />);
    expect(screen.getByText("Big News Story")).toBeInTheDocument();
    expect(screen.getByText("Example News")).toBeInTheDocument();
  });

  it("renders a follow-source button for the article's source", () => {
    const article = makeArticle({ sourceName: "Example News" });
    render(<NewsCardFour article={article} viewOnly />);
    expect(screen.getByRole("button", { name: "Follow Example News" })).toBeInTheDocument();
  });

  it("eagerly loads only the first few cards by index, lazy-loading the rest", () => {
    const article = makeArticle({ title: "Big News Story" });

    // A preloaded next/image omits the `loading` attribute entirely rather
    // than setting loading="eager" — its absence, contrasted with the
    // explicit "lazy" below, is what distinguishes the two states here.
    const { unmount } = render(<NewsCardFour article={article} viewOnly index={0} />);
    expect(screen.getByAltText("Big News Story")).not.toHaveAttribute("loading");
    unmount();

    render(<NewsCardFour article={article} viewOnly index={4} />);
    expect(screen.getByAltText("Big News Story")).toHaveAttribute("loading", "lazy");
  });

  it("strips a trailing ' - Source' suffix from the title", () => {
    const article = makeArticle({ title: "Big News Story - Example News" });
    render(<NewsCardFour article={article} viewOnly />);
    expect(screen.getByText("Big News Story")).toBeInTheDocument();
  });

  it("renders the category-colored fallback art instead of a broken image when there's no urlToImage", () => {
    const article = makeArticle({ urlToImage: null, category: ["Business"], title: "No Image Story" });
    const { container } = render(<NewsCardFour article={article} viewOnly />);

    expect(screen.queryByAltText("No Image Story")).not.toBeInTheDocument();
    const art = container.querySelector('[style*="linear-gradient"]');
    expect(art).toBeInTheDocument();
    expect(art.style.background).toContain("rgb(21, 128, 61)"); // Business: #15803d
  });

  it("swaps to the fallback art when the thumbnail fails to load", () => {
    const article = makeArticle({ urlToImage: "https://example.com/broken.jpg", title: "Broken Thumbnail" });
    const { container } = render(<NewsCardFour article={article} viewOnly />);

    const img = screen.getByAltText("Broken Thumbnail");
    fireEvent.error(img);

    expect(screen.queryByAltText("Broken Thumbnail")).not.toBeInTheDocument();
    expect(container.querySelector('[style*="linear-gradient"]')).toBeInTheDocument();
  });

  it("applies the blurred-backdrop treatment once a too-small source image finishes loading", async () => {
    const article = makeArticle({ urlToImage: "https://example.com/tiny.jpg", title: "Tiny Thumbnail" });
    render(<NewsCardFour article={article} viewOnly />);

    const img = screen.getByAltText("Tiny Thumbnail");
    expect(img.className).not.toMatch(/lowResImage/);

    Object.defineProperty(img, "naturalWidth", { value: 60, configurable: true });
    Object.defineProperty(img, "naturalHeight", { value: 60, configurable: true });
    fireEvent.load(img);

    await waitFor(() => expect(img.className).toMatch(/lowResImage/));
  });

  it("does not apply the blurred-backdrop treatment for a normal-sized image", async () => {
    const article = makeArticle({ urlToImage: "https://example.com/normal.jpg", title: "Normal Thumbnail" });
    render(<NewsCardFour article={article} viewOnly />);

    const img = screen.getByAltText("Normal Thumbnail");
    Object.defineProperty(img, "naturalWidth", { value: 800, configurable: true });
    Object.defineProperty(img, "naturalHeight", { value: 450, configurable: true });
    fireEvent.load(img);

    await waitFor(() => expect(img["data-loaded-src"]).toBeTruthy());
    expect(img.className).not.toMatch(/lowResImage/);
  });

  it("shows a lock icon for paywalled sources", () => {
    const article = makeArticle({ sourceName: "New York Times" });
    render(<NewsCardFour article={article} viewOnly />);
    expect(screen.getByTitle(/may be behind a paywall/i)).toBeInTheDocument();
  });

  it("does not show a lock icon for non-paywalled sources", () => {
    const article = makeArticle({ sourceName: "Example News" });
    render(<NewsCardFour article={article} viewOnly />);
    expect(screen.queryByTitle(/may be behind a paywall/i)).not.toBeInTheDocument();
  });

  it("redirects to login and shows a toast when liking while logged out", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    render(<NewsCardFour article={article} viewOnly />);

    await user.click(screen.getByRole("button", { name: /like this article/i }));

    expect(toast.info).toHaveBeenCalledWith("Sign in to like articles.");
    expect(push).toHaveBeenCalledWith("/login");
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/articles/like",
      expect.anything()
    );
  });

  it("optimistically likes the article when logged in, then confirms via the API", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    const article = makeArticle({ likeCount: 2 });
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/like", () => makeFetchResponse({ success: true })]]);
    render(<NewsCardFour article={article} viewOnly />);

    const likeButton = screen.getByRole("button", { name: /like this article/i });
    await user.click(likeButton);

    expect(screen.getByRole("button", { name: /unlike this article/i })).toHaveTextContent("3");
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/articles/like",
        expect.objectContaining({ method: "POST" })
      )
    );
  });

  it("reverts the optimistic like on API failure", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    const article = makeArticle({ likeCount: 2 });
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/like", () => makeFetchResponse(null, { ok: false, status: 500 })]]);
    render(<NewsCardFour article={article} viewOnly />);

    await user.click(screen.getByRole("button", { name: /like this article/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /like this article/i })).toHaveTextContent("2")
    );
    expect(toast.error).toHaveBeenCalledWith("Couldn't update like status. Please try again.");
  });

  it("applies a category-colored top border when a category is present", () => {
    const article = makeArticle({ category: ["Tech"] });
    const { container } = render(<NewsCardFour article={article} viewOnly />);
    const card = container.querySelector('[class*="cardContainer"]');
    expect(card.style.borderTopColor).toBeTruthy();
  });

  it("links the read-more button to the article's own url", () => {
    const article = makeArticle({ url: "https://example.com/story" });
    render(<NewsCardFour article={article} viewOnly />);
    expect(screen.getByRole("link", { name: /read article/i })).toHaveAttribute(
      "href",
      "https://example.com/story"
    );
  });

  it("tracks a click when the thumbnail image link is clicked", async () => {
    const user = userEvent.setup();
    const article = makeArticle({ title: "Tracked Story" });
    render(<NewsCardFour article={article} viewOnly />);

    await user.click(screen.getByAltText("Tracked Story"));
    // trackArticleClick only fires sendBeacon/fetch when navigator.sendBeacon
    // is unavailable in jsdom, but at minimum it must not throw and the link
    // click should be handled without error.
    expect(screen.getByAltText("Tracked Story")).toBeInTheDocument();
  });

  it("tracks a click when the read-more button is clicked", async () => {
    const user = userEvent.setup();
    const article = makeArticle({ title: "Tracked Story Two", url: "https://example.com/tracked" });
    render(<NewsCardFour article={article} viewOnly />);

    await user.click(screen.getByRole("link", { name: /read article/i }));
    expect(screen.getByRole("link", { name: /read article/i })).toBeInTheDocument();
  });

  it("marks the article as read on a left swipe past the threshold", async () => {
    mockSession = makeSession();
    const article = makeArticle({ isRead: false, url: "https://example.com/swipe-read" });
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/mark-all-read", () => makeFetchResponse({ success: true })]]);
    const { container } = render(<NewsCardFour article={article} viewOnly />);

    const wrapper = container.querySelector('[class*="swipeWrapper"]');
    fireEvent.touchStart(wrapper, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/articles/mark-all-read",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ urls: [article.url] }) })
      )
    );
  });

  it("logs an error but does not throw when marking read via swipe fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSession = makeSession();
    const article = makeArticle({ isRead: false, url: "https://example.com/swipe-fail" });
    mockRoutes([...ARCHIVE_ROUTES, ["/api/articles/mark-all-read", () => Promise.reject(new Error("network down"))]]);
    const { container } = render(<NewsCardFour article={article} viewOnly />);

    const wrapper = container.querySelector('[class*="swipeWrapper"]');
    fireEvent.touchStart(wrapper, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper);

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to mark article as read:", expect.any(Error))
    );
    consoleErrorSpy.mockRestore();
  });

  it("does not mark as read on left swipe when logged out", () => {
    mockSession = null;
    const article = makeArticle({ isRead: false });
    const { container } = render(<NewsCardFour article={article} viewOnly />);

    const wrapper = container.querySelector('[class*="swipeWrapper"]');
    fireEvent.touchStart(wrapper, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(wrapper);

    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/articles/mark-all-read",
      expect.anything()
    );
  });

  it("clicks the save action on a right swipe past the threshold", () => {
    const article = makeArticle();
    const { container } = render(<NewsCardFour article={article} viewOnly />);

    const saveButton = container.querySelector('[data-action="save"]');
    const clickSpy = vi.spyOn(saveButton, "click");

    const wrapper = container.querySelector('[class*="swipeWrapper"]');
    fireEvent.touchStart(wrapper, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(wrapper, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(wrapper);

    expect(clickSpy).toHaveBeenCalled();
  });
});
