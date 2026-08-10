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
});
