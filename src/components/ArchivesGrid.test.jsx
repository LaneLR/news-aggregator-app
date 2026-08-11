import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: refreshMock, back: vi.fn() }),
}));

const confirmMock = vi.fn();
vi.mock("./ConfirmDialogProvider", () => ({ useConfirm: () => confirmMock }));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const { default: ArchivesGrid } = await import("./ArchivesGrid");

const archives = [
  { id: "archive-1", name: "Saved for later", articleCount: 3, lastUpdated: "today", articleImages: [] },
  { id: "archive-2", name: "Deep dives", articleCount: 1, lastUpdated: "yesterday", articleImages: [] },
];

describe("ArchivesGrid", () => {
  beforeEach(() => {
    confirmMock.mockReset();
    toast.success.mockClear();
  });

  it("renders the create card plus one card per archive", () => {
    render(<ArchivesGrid archives={archives} />);
    expect(screen.getByRole("button", { name: /Create New Archive/ })).toBeInTheDocument();
    expect(screen.getByText("Saved for later")).toBeInTheDocument();
    expect(screen.getByText("Deep dives")).toBeInTheDocument();
  });

  it("does not show a delete button for the default 'Saved for later' archive", () => {
    render(<ArchivesGrid archives={archives} />);
    expect(screen.queryAllByRole("button", { name: "Delete archive" })).toHaveLength(1);
  });

  it("deletes a non-default archive through its DeleteArchiveButton", async () => {
    const user = userEvent.setup();
    confirmMock.mockResolvedValue(true);
    global.fetch.mockResolvedValueOnce(makeFetchResponse(null, { status: 204 }));

    render(<ArchivesGrid archives={archives} />);
    await user.click(screen.getByRole("button", { name: "Delete archive" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith("/api/archives/archive-2", { method: "DELETE" });
  });

  it("renders with an empty archive list", () => {
    render(<ArchivesGrid archives={[]} />);
    expect(screen.getByRole("button", { name: /Create New Archive/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete archive" })).not.toBeInTheDocument();
  });

  it("persists a drag-and-drop reorder to localStorage and re-renders in the new order", () => {
    localStorage.removeItem("morningfeeds:archiveOrder");
    render(<ArchivesGrid archives={archives} />);

    const cards = screen.getAllByText(/Saved for later|Deep dives/).map((el) => el.closest("[draggable]"));
    const [first, second] = cards;

    fireEvent.dragStart(first, { dataTransfer: {} });
    fireEvent.dragOver(second, { dataTransfer: {} });
    fireEvent.drop(second, { dataTransfer: {} });
    fireEvent.dragEnd(first);

    expect(JSON.parse(localStorage.getItem("morningfeeds:archiveOrder"))).toEqual(["archive-2", "archive-1"]);
  });

  it("ignores a drop back onto the same card that started the drag", () => {
    localStorage.removeItem("morningfeeds:archiveOrder");
    render(<ArchivesGrid archives={archives} />);

    const [first] = screen.getAllByText(/Saved for later|Deep dives/).map((el) => el.closest("[draggable]"));

    fireEvent.dragStart(first, { dataTransfer: {} });
    fireEvent.dragOver(first, { dataTransfer: {} });
    fireEvent.drop(first, { dataTransfer: {} });

    expect(localStorage.getItem("morningfeeds:archiveOrder")).toBeNull();
  });
});
