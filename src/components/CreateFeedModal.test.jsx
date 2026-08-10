import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const confirmMock = vi.fn();
vi.mock("./ConfirmDialogProvider", () => ({ useConfirm: () => confirmMock }));

const { default: CreateFeedModal } = await import("./CreateFeedModal");

function mockFetchRoutes(routes) {
  global.fetch.mockImplementation((url, opts) => {
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? url.toString() === matcher : matcher.test(url.toString());
      if (matches) return Promise.resolve(handler(opts));
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("CreateFeedModal", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
    confirmMock.mockReset();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<CreateFeedModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("loads available sources/categories and creates a feed", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    mockFetchRoutes([
      ["/api/filters", () => makeFetchResponse({ sources: ["BBC", "CNN"], categories: ["Tech", "Sports"] })],
      ["/api/feeds", () => makeFetchResponse({ id: "feed-1" })],
    ]);

    render(<CreateFeedModal isOpen onClose={onClose} onSuccess={onSuccess} />);

    expect(await screen.findByText("BBC")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Feed name"), "Tech Digest");
    await user.click(screen.getByText("BBC"));
    await user.click(screen.getByText("Tech"));
    await user.click(screen.getByRole("button", { name: "Create Feed" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Feed created."));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("pre-fills fields and shows Delete Feed in edit mode", async () => {
    mockFetchRoutes([["/api/filters", () => makeFetchResponse({ sources: [], categories: [] })]]);
    const feedToEdit = { id: "feed-1", title: "My Feed", sourceNames: ["BBC"], categories: ["Tech"] };

    render(<CreateFeedModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} feedToEdit={feedToEdit} />);

    expect(await screen.findByDisplayValue("My Feed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Feed" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Edit Feed" })).toBeInTheDocument();
  });

  it("deletes the feed after confirmation in edit mode", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    confirmMock.mockResolvedValue(true);
    mockFetchRoutes([
      ["/api/filters", () => makeFetchResponse({ sources: [], categories: [] })],
      ["/api/feeds/feed-1", () => makeFetchResponse({})],
    ]);
    const feedToEdit = { id: "feed-1", title: "My Feed", sourceNames: [], categories: [] };

    render(<CreateFeedModal isOpen onClose={onClose} onSuccess={onSuccess} feedToEdit={feedToEdit} />);
    await screen.findByDisplayValue("My Feed");
    await user.click(screen.getByRole("button", { name: "Delete Feed" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Feed deleted."));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error toast when saving fails", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      ["/api/filters", () => makeFetchResponse({ sources: [], categories: [] })],
      ["/api/feeds", () => makeFetchResponse(null, { ok: false, status: 500 })],
    ]);

    render(<CreateFeedModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
    await screen.findByText("Select Sources");
    await user.type(screen.getByLabelText("Feed name"), "Broken Feed");
    await user.click(screen.getByRole("button", { name: "Create Feed" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to create feed."));
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockFetchRoutes([["/api/filters", () => makeFetchResponse({ sources: [], categories: [] })]]);

    render(<CreateFeedModal isOpen onClose={onClose} onSuccess={vi.fn()} />);
    await screen.findByText("Select Sources");
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
