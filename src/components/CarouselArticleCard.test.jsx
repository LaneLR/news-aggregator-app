import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse } from "@/test/fixtures";

const mockSession = { value: null };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession.value, status: mockSession.value ? "authenticated" : "unauthenticated" }),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

// Isolate CarouselCard's own behavior from ArchiveToggleButton/ShareButton's
// internals (each has its own dedicated test file already).
vi.mock("./ArchiveToggleButton", () => ({ default: () => <div>ArchiveToggle</div> }));
vi.mock("./ShareButton", () => ({ default: () => <div>Share</div> }));

const { default: CarouselCard } = await import("./CarouselArticleCard");

function mockFetchRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? url.toString() === matcher : matcher.test(url.toString());
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("CarouselArticleCard", () => {
  beforeEach(() => {
    mockSession.value = null;
    pushMock.mockClear();
    toast.error.mockClear();
  });

  it("renders title, source, category badge, and a link to the article page", () => {
    const article = makeArticle({ id: "a1", title: "Big Headline", sourceName: "BBC", category: ["Tech"] });
    render(<CarouselCard article={article} />);

    expect(screen.getByText("Big Headline")).toBeInTheDocument();
    expect(screen.getByText("BBC")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Big Headline/ })).toHaveAttribute("href", "/article/a1");
  });

  it("redirects to login instead of liking when signed out", async () => {
    const user = userEvent.setup();
    const article = makeArticle();
    render(<CarouselCard article={article} />);

    await user.click(screen.getByRole("button", { name: "Like this article" }));
    expect(toast.info).toHaveBeenCalledWith("Sign in to like articles.");
    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("likes the article optimistically when signed in", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([[/\/api\/articles\/like/, () => makeFetchResponse({ success: true })]]);
    const article = makeArticle({ likeCount: 2, isLikedByUser: false });

    render(<CarouselCard article={article} />);
    await user.click(screen.getByRole("button", { name: "Like this article" }));

    expect(await screen.findByRole("button", { name: "Unlike this article" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("reverts the optimistic like and shows a toast if the request fails", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1" } };
    mockFetchRoutes([[/\/api\/articles\/like/, () => makeFetchResponse(null, { ok: false, status: 500 })]]);
    const article = makeArticle({ likeCount: 2, isLikedByUser: false });

    render(<CarouselCard article={article} />);
    await user.click(screen.getByRole("button", { name: "Like this article" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Like this article" })).toBeInTheDocument()
    );
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Couldn't update like status. Please try again.");
  });

  it("shows a paywall lock icon for known paywalled sources", () => {
    const article = makeArticle({ sourceName: "The Wall Street Journal" });
    render(<CarouselCard article={article} />);
    expect(screen.getByTitle("This source could be behind a paywall.")).toBeInTheDocument();
  });

  it("renders the category-colored fallback art instead of a broken image when the article has no image", () => {
    const article = makeArticle({ urlToImage: null, category: ["Entertainment"], title: "No Image Article" });
    const { container } = render(<CarouselCard article={article} />);

    expect(screen.queryByAltText("No Image Article")).not.toBeInTheDocument();
    expect(container.querySelector('[class*="imageLink"] [style*="linear-gradient"]')).toBeInTheDocument();
  });
});
