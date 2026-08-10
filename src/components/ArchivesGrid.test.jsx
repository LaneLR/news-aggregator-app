import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
});
