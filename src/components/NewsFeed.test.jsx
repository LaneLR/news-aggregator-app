import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse } from "@/test/fixtures";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { default: NewsFeed } = await import("./NewsFeed");

function mockRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    const urlStr = url.toString();
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? urlStr === matcher : matcher.test(urlStr);
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${urlStr}`));
  });
}

describe("NewsFeed", () => {
  it("shows a loading state, then renders fetched articles", async () => {
    const article = makeArticle({ title: "Breaking story" });
    mockRoutes([
      [/\/api\/fetched$/, () => makeFetchResponse({ articles: [article] })],
      ["/api/archives/default", () => makeFetchResponse({ archiveId: "archive-1" })],
      ["/api/archives", () => makeFetchResponse({ archives: [] })],
      [/\/api\/articles\/check/, () => makeFetchResponse({ saved: false })],
    ]);

    render(<NewsFeed />);

    expect(await screen.findByText("Breaking story")).toBeInTheDocument();
  });

  it("fetches from the feed-specific endpoint when a feedId is given", async () => {
    mockRoutes([
      [/\/api\/feeds\/feed-1\/articles$/, () => makeFetchResponse({ articles: [] })],
      ["/api/archives/default", () => makeFetchResponse({ archiveId: "archive-1" })],
    ]);

    render(<NewsFeed feedId="feed-1" />);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/feeds/feed-1/articles"),
        expect.anything()
      )
    );
  });

  it("shows a 'new articles available' banner and refreshes when clicked", async () => {
    const user = userEvent.setup();
    const older = makeArticle({ url: "https://example.com/old", publishedAt: "2026-01-01T00:00:00.000Z" });
    const newer = makeArticle({ url: "https://example.com/new", title: "Fresher story", publishedAt: "2026-01-02T00:00:00.000Z" });

    let callCount = 0;
    global.fetch.mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.endsWith("/api/fetched")) {
        callCount += 1;
        return Promise.resolve(makeFetchResponse({ articles: callCount === 1 ? [older] : [newer] }));
      }
      if (urlStr === "/api/archives/default") return Promise.resolve(makeFetchResponse({ archiveId: "archive-1" }));
      if (urlStr === "/api/archives") return Promise.resolve(makeFetchResponse({ archives: [] }));
      if (/\/api\/articles\/check/.test(urlStr)) return Promise.resolve(makeFetchResponse({ saved: false }));
      return Promise.reject(new Error(`Unmocked fetch: ${urlStr}`));
    });

    render(<NewsFeed />);
    await screen.findByText(older.title);

    window.dispatchEvent(new Event("focus"));

    await user.click(await screen.findByRole("button", { name: /new articles available/i }));

    expect(await screen.findByText("Fresher story")).toBeInTheDocument();
  });
});
