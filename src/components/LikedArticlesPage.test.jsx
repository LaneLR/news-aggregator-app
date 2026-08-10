import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeArticle, makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { default: LikedArticlesPage } = await import("./LikedArticlesPage");

// NewsCardFour (rendered per liked article) mounts ArchiveToggleButton,
// which independently calls /api/archives and /api/articles/check — those
// are stubbed alongside /api/articles/liked so the page's own fetch isn't
// swallowed by a looser route.
function mockRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? url.toString() === matcher : matcher.test(url.toString());
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("LikedArticlesPage", () => {
  it("prompts sign-in when logged out", () => {
    mockSession = null;
    render(<LikedArticlesPage />);
    expect(screen.getByText(/sign in to see your liked articles/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no liked articles", async () => {
    mockSession = makeSession();
    mockRoutes([["/api/articles/liked", () => makeFetchResponse({ articles: [] })]]);
    render(<LikedArticlesPage />);

    expect(await screen.findByText(/haven't liked any articles yet/i)).toBeInTheDocument();
  });

  it("renders liked articles once loaded", async () => {
    mockSession = makeSession();
    const article = makeArticle({ title: "A liked story" });
    mockRoutes([
      ["/api/articles/liked", () => makeFetchResponse({ articles: [article] })],
      ["/api/archives", () => makeFetchResponse({ archives: [] })],
      [/\/api\/articles\/check/, () => makeFetchResponse({ saved: false })],
    ]);
    render(<LikedArticlesPage />);

    expect(await screen.findByText("A liked story")).toBeInTheDocument();
  });

  it("shows the page heading", async () => {
    mockSession = makeSession();
    mockRoutes([["/api/articles/liked", () => makeFetchResponse({ articles: [] })]]);
    render(<LikedArticlesPage />);
    expect(screen.getByRole("heading", { name: /your liked articles/i })).toBeInTheDocument();
  });
});
