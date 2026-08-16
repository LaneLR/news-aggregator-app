import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeArticle, makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { default: HeroCarousel } = await import("./HeroCarousel");

// Every CarouselArticleCard mounts ArchiveToggleButton (/api/archives GET),
// so that route needs a baseline stub whenever articles are rendered.
const ARCHIVE_ROUTE = ["/api/archives", () => makeFetchResponse({ archives: [] })];

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

describe("HeroCarousel", () => {
  it("defaults to the Trending view for a free/logged-out user (no toggle shown)", async () => {
    mockSession = null;
    mockRoutes([[/\/api\/articles\/trending/, () => makeFetchResponse({ articles: [] })]]);
    render(<HeroCarousel />);

    expect(await screen.findByRole("heading", { name: /trending/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "For You" })).not.toBeInTheDocument();
  });

  it("defaults to the For You view for a subscribed user, with a toggle available", async () => {
    mockSession = makeSession({ tier: "Subscribed" });
    mockRoutes([["/api/recommendations", () => makeFetchResponse({ articles: [] })]]);
    render(<HeroCarousel />);

    expect(await screen.findByRole("heading", { name: /for you/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "For You" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trending" })).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no trending articles", async () => {
    mockSession = null;
    mockRoutes([[/\/api\/articles\/trending/, () => makeFetchResponse({ articles: [] })]]);
    render(<HeroCarousel />);

    expect(await screen.findByText(/nothing trending right now/i)).toBeInTheDocument();
  });

  it("renders articles once loaded", async () => {
    mockSession = null;
    const article = makeArticle({ title: "Hero story" });
    mockRoutes([
      [/\/api\/articles\/trending/, () => makeFetchResponse({ articles: [article] })],
      ARCHIVE_ROUTE,
    ]);
    render(<HeroCarousel />);

    expect(await screen.findByText("Hero story")).toBeInTheDocument();
  });

  it("switches to Most Liked sort when clicked, re-fetching with the new sort", async () => {
    const user = userEvent.setup();
    mockSession = null;
    mockRoutes([[/\/api\/articles\/trending/, () => makeFetchResponse({ articles: [] })]]);
    render(<HeroCarousel />);
    await screen.findByText(/nothing trending right now/i);

    await user.click(screen.getByRole("button", { name: "Most Liked" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("sort=liked"))
    );
  });

  it("switches between For You and Trending for a subscribed user", async () => {
    const user = userEvent.setup();
    mockSession = makeSession({ tier: "Subscribed" });
    mockRoutes([
      ["/api/recommendations", () => makeFetchResponse({ articles: [] })],
      [/\/api\/articles\/trending/, () => makeFetchResponse({ articles: [] })],
    ]);
    render(<HeroCarousel />);
    await screen.findByRole("heading", { name: /for you/i });

    await user.click(screen.getByRole("button", { name: "Trending" }));
    expect(await screen.findByRole("heading", { name: /trending/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "For You" }));
    expect(await screen.findByRole("heading", { name: /for you/i })).toBeInTheDocument();
  });

  it("switches back to Most Read sort after Most Liked was selected", async () => {
    const user = userEvent.setup();
    mockSession = null;
    mockRoutes([[/\/api\/articles\/trending/, () => makeFetchResponse({ articles: [] })]]);
    render(<HeroCarousel />);
    await screen.findByText(/nothing trending right now/i);

    await user.click(screen.getByRole("button", { name: "Most Liked" }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining("sort=liked"))
    );

    await user.click(screen.getByRole("button", { name: "Most Read" }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining("sort=trending"))
    );
  });

  it("logs an error and stops loading when the fetch fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSession = null;
    mockRoutes([]);
    render(<HeroCarousel />);

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load hero carousel articles:",
        expect.any(Error)
      )
    );
    expect(await screen.findByText(/nothing trending right now/i)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });
});
