import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const mockSession = { value: null };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession.value, status: mockSession.value ? "authenticated" : "unauthenticated" }),
}));

vi.mock("./NewsFeed", () => ({ default: ({ feedId }) => <div>NewsFeed:{feedId ?? "all"}</div> }));
vi.mock("./CreateFeedModal", () => ({
  default: ({ isOpen, feedToEdit, onClose, onSuccess }) =>
    isOpen ? (
      <div>
        CreateFeedModal open (edit: {feedToEdit ? feedToEdit.title : "none"})
        <button onClick={onClose}>Close Modal</button>
        <button onClick={onSuccess}>Trigger Success</button>
      </div>
    ) : null,
}));

const { default: FeedManager } = await import("./FeedManager");

function mockFetchRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? url.toString() === matcher : matcher.test(url.toString());
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("FeedManager", () => {
  beforeEach(() => {
    mockSession.value = null;
  });

  it("shows only the News feed, no toolbar, for signed-out/free users", () => {
    render(<FeedManager />);
    expect(screen.getByText("My Feeds")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create Feed/ })).not.toBeInTheDocument();
    expect(screen.getByText("NewsFeed:all")).toBeInTheDocument();
  });

  it("shows the feed toolbar and loads feeds for subscribed users", async () => {
    mockSession.value = { user: { id: "user-1", tier: "Plus" } };
    mockFetchRoutes([["/api/feeds", () => makeFetchResponse([{ id: "feed-1", title: "Tech Feed" }])]]);

    render(<FeedManager />);
    expect(await screen.findByRole("option", { name: "Tech Feed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Feed/ })).toBeInTheDocument();
  });

  it("shows Edit Feed only once a feed is selected, and opens the modal with the right feed", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1", tier: "Plus" } };
    mockFetchRoutes([["/api/feeds", () => makeFetchResponse([{ id: "feed-1", title: "Tech Feed" }])]]);

    render(<FeedManager />);
    await screen.findByRole("option", { name: "Tech Feed" });
    expect(screen.queryByRole("button", { name: /Edit Feed/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "feed-1");
    await user.click(screen.getByRole("button", { name: /Edit Feed/ }));

    expect(screen.getByText("CreateFeedModal open (edit: Tech Feed)")).toBeInTheDocument();
  });

  it("opens the create-feed modal via 'Create Feed' and closes it, and refreshes feeds on success", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1", tier: "Plus" } };
    mockFetchRoutes([["/api/feeds", () => makeFetchResponse([{ id: "feed-1", title: "Tech Feed" }])]]);

    render(<FeedManager />);
    await screen.findByRole("option", { name: "Tech Feed" });

    await user.click(screen.getByRole("button", { name: /Create Feed/ }));
    expect(screen.getByText("CreateFeedModal open (edit: none)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close Modal" }));
    expect(screen.queryByText(/CreateFeedModal open/)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "feed-1");
    await user.click(screen.getByRole("button", { name: /Create Feed/ }));
    await user.click(screen.getByRole("button", { name: "Trigger Success" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/feeds"));
    // onActionSuccess also clears the selected feed, so "Edit Feed" disappears.
    expect(screen.queryByRole("button", { name: /Edit Feed/ })).not.toBeInTheDocument();
  });

  it("shows an error status message when reading the OPML file throws", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSession.value = { user: { id: "user-1", tier: "Plus" } };
    mockFetchRoutes([["/api/feeds", () => makeFetchResponse([])]]);

    render(<FeedManager />);
    await screen.findByRole("button", { name: /Create Feed/ });

    const file = new File(["<opml></opml>"], "myfeeds.opml", { type: "text/xml" });
    vi.spyOn(file, "text").mockRejectedValue(new Error("read error"));
    const input = document.querySelector('input[type="file"]');
    await user.upload(input, file);

    expect(await screen.findByText("Something went wrong reading that file.")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("OPML import failed:", expect.any(Error));
    consoleError.mockRestore();
  });

  it("imports an OPML file and shows a success status message", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1", tier: "Plus" } };
    mockFetchRoutes([
      ["/api/feeds", () => makeFetchResponse([])],
      [
        "/api/feeds/import/opml",
        () => makeFetchResponse({ feed: { title: "Imported" }, matchedCount: 2, skippedCount: 1 }),
      ],
    ]);

    render(<FeedManager />);
    await screen.findByRole("button", { name: /Create Feed/ });

    const file = new File(["<opml></opml>"], "myfeeds.opml", { type: "text/xml" });
    const input = document.querySelector('input[type="file"]');
    await user.upload(input, file);

    expect(await screen.findByText(/Imported "Imported" — matched 2 sources, skipped 1/)).toBeInTheDocument();
  });

  it("shows an error status message when OPML import fails", async () => {
    const user = userEvent.setup();
    mockSession.value = { user: { id: "user-1", tier: "Plus" } };
    mockFetchRoutes([
      ["/api/feeds", () => makeFetchResponse([])],
      ["/api/feeds/import/opml", () => makeFetchResponse({ error: "Invalid OPML file." }, { ok: false, status: 400 })],
    ]);

    render(<FeedManager />);
    await screen.findByRole("button", { name: /Create Feed/ });

    const file = new File(["not opml"], "bad.opml", { type: "text/xml" });
    const input = document.querySelector('input[type="file"]');
    await user.upload(input, file);

    expect(await screen.findByText("Invalid OPML file.")).toBeInTheDocument();
  });
});
