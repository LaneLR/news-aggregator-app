import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

// Defaults to signed-in — every existing test here exercises the normal
// save/remove flow, which requires a session. The signed-out case (redirect
// to /login instead of opening the dropdown) gets its own test below.
let mockSession = makeSession();
const push = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

// Imported after the mocks so ArchiveToggleButton picks up the mocked hooks.
const { default: ArchiveToggleButton } = await import("./ArchiveToggleButton");

const article = {
  id: "article-1",
  title: "Test Article",
  url: "https://example.com/a",
  publishedAt: "2026-01-01T00:00:00.000Z",
  urlToImage: "https://example.com/a.jpg",
  sourceName: "Example",
};

function mockFetchRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    for (const [matcher, handler] of routes) {
      // Exact match for a plain string — "/api/archives" must NOT match
      // "/api/archives/x/articles" too, or a route earlier in the list
      // silently swallows a more specific one later in it.
      const matches = typeof matcher === "string" ? url.toString() === matcher : matcher.test(url.toString());
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("ArchiveToggleButton", () => {
  beforeEach(() => {
    mockSession = makeSession();
    push.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    toast.info.mockClear();
  });

  it("redirects to login instead of opening the dropdown when signed out", async () => {
    const user = userEvent.setup();
    mockSession = null;

    render(<ArchiveToggleButton article={article} viewOnly />);

    await user.click(screen.getByRole("button", { name: "Save to archive" }));

    expect(toast.info).toHaveBeenCalledWith("Sign in to save articles.");
    expect(push).toHaveBeenCalledWith("/login");
    expect(screen.getByRole("button", { name: "Save to archive" })).toHaveAttribute("aria-expanded", "false");
    // No authenticated calls attempted for a visitor who was never going to
    // see their result anyway.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows 'Save to archive' when the article isn't saved yet (ordinary feed card)", async () => {
    mockFetchRoutes([
      ["/api/archives", () => makeFetchResponse({ archives: [] })],
      [/\/api\/articles\/check/, () => makeFetchResponse({ saved: false })],
    ]);

    render(<ArchiveToggleButton article={article} viewOnly />);

    expect(await screen.findByRole("button", { name: "Save to archive" })).toBeInTheDocument();
  });

  it("shows a filled, still-clickable icon for an already-saved article in an ordinary feed", async () => {
    // viewOnly=true with no archiveId is how every ordinary feed
    // (category/news/for-you/following/liked pages) renders its cards —
    // regression coverage for a bug where the "already saved?" check was
    // skipped for *any* viewOnly card, so a previously-saved article's
    // bookmark icon always rendered as unsaved.
    mockFetchRoutes([
      ["/api/archives", () => makeFetchResponse({ archives: [] })],
      [/\/api\/articles\/check/, () => makeFetchResponse({ saved: true, archiveId: "archive-1" })],
    ]);

    render(<ArchiveToggleButton article={article} viewOnly />);

    const saved = await screen.findByRole("button", { name: "Saved" });
    expect(saved).toBeEnabled();
  });

  it("opens the archive dropdown and saves to the chosen archive", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      ["/api/archives", () => makeFetchResponse({ archives: [{ id: "archive-1", name: "Reading list" }] })],
      [/\/api\/articles\/check/, () => makeFetchResponse({ saved: false })],
      [/\/api\/archives\/archive-1\/articles$/, () => makeFetchResponse({ success: true })],
    ]);

    render(<ArchiveToggleButton article={article} viewOnly />);

    await user.click(await screen.findByRole("button", { name: "Save to archive" }));
    await user.click(await screen.findByRole("button", { name: "Reading list" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument());
  });

  it("shows a 'Remove from archive' button immediately on an archive's own detail page", () => {
    // archives/(account)/[id]/page.js renders every card here with a known
    // archiveId + viewOnly=false — every one of those articles is, by
    // construction, already a member of that archive, so this should never
    // need a round trip to find that out.
    render(<ArchiveToggleButton article={article} archiveId="archive-1" />);

    expect(screen.getByRole("button", { name: "Remove from archive" })).toBeInTheDocument();
  });

  it("removes the article from its archive when clicked", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      ["/api/archives", () => makeFetchResponse({ archives: [] })],
      [/\/api\/archives\/archive-1\/articles\/article-1/, () => makeFetchResponse(null, { status: 204 })],
    ]);

    render(<ArchiveToggleButton article={article} archiveId="archive-1" />);

    await user.click(screen.getByRole("button", { name: "Remove from archive" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Remove from archive" })).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Save to archive" })).toBeInTheDocument();
  });

  it("renders a static, non-interactive 'Saved' indicator when archiveId and viewOnly are both set", () => {
    render(<ArchiveToggleButton article={article} archiveId="archive-1" viewOnly />);

    const saved = screen.getByLabelText("Saved");
    expect(saved.tagName).toBe("DIV");
  });

  it("shows an error toast when saving fails", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      ["/api/archives", () => makeFetchResponse({ archives: [{ id: "archive-1", name: "Reading list" }] })],
      [/\/api\/articles\/check/, () => makeFetchResponse({ saved: false })],
      [
        /\/api\/archives\/archive-1\/articles$/,
        () => makeFetchResponse({ message: "Nope" }, { ok: false, status: 400 }),
      ],
    ]);

    render(<ArchiveToggleButton article={article} viewOnly />);

    await user.click(await screen.findByRole("button", { name: "Save to archive" }));
    await user.click(await screen.findByRole("button", { name: "Reading list" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nope"));
  });

  it("shows an error toast when removal fails", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      ["/api/archives", () => makeFetchResponse({ archives: [] })],
      [
        /\/api\/archives\/archive-1\/articles\/article-1/,
        () => makeFetchResponse({ message: "Could not remove" }, { ok: false, status: 400 }),
      ],
    ]);

    render(<ArchiveToggleButton article={article} archiveId="archive-1" />);

    await user.click(screen.getByRole("button", { name: "Remove from archive" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not remove"));
  });
});
