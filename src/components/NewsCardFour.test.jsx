import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("strips a trailing ' - Source' suffix from the title", () => {
    const article = makeArticle({ title: "Big News Story - Example News" });
    render(<NewsCardFour article={article} viewOnly />);
    expect(screen.getByText("Big News Story")).toBeInTheDocument();
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
});
