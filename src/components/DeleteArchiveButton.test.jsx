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

const { default: DeleteArchiveButton } = await import("./DeleteArchiveButton");

describe("DeleteArchiveButton", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    confirmMock.mockReset();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("does nothing if the confirm dialog is declined", async () => {
    const user = userEvent.setup();
    confirmMock.mockResolvedValue(false);

    render(<DeleteArchiveButton archiveId="archive-1" />);
    await user.click(screen.getByRole("button", { name: "Delete archive" }));

    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("deletes the archive and refreshes on confirm", async () => {
    const user = userEvent.setup();
    confirmMock.mockResolvedValue(true);
    global.fetch.mockResolvedValueOnce(makeFetchResponse(null, { status: 204 }));

    render(<DeleteArchiveButton archiveId="archive-1" />);
    await user.click(screen.getByRole("button", { name: "Delete archive" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith("/api/archives/archive-1", { method: "DELETE" });
    expect(toast.success).toHaveBeenCalledWith("Archive deleted.");
  });

  it("shows an error toast when deletion fails", async () => {
    const user = userEvent.setup();
    confirmMock.mockResolvedValue(true);
    global.fetch.mockResolvedValueOnce(makeFetchResponse(null, { ok: false, status: 500 }));

    render(<DeleteArchiveButton archiveId="archive-1" />);
    await user.click(screen.getByRole("button", { name: "Delete archive" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to delete archive. Please try again."));
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
