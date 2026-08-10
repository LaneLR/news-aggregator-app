import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const { default: ArchiveVisibilityToggle } = await import("./ArchiveVisibilityToggle");

describe("ArchiveVisibilityToggle", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("shows 'Make Public' when the archive starts private", () => {
    render(<ArchiveVisibilityToggle archiveId="archive-1" initialIsPublic={false} initialSlug={null} />);
    expect(screen.getByRole("button", { name: /Make Public/ })).toBeInTheDocument();
  });

  it("shows the share link when the archive starts public", () => {
    render(<ArchiveVisibilityToggle archiveId="archive-1" initialIsPublic initialSlug="abc123" />);
    expect(screen.getByRole("button", { name: /Public/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\/archives\/shared\/abc123/)).toBeInTheDocument();
  });

  it("toggles to public and reveals a share link on success", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ isPublic: true, publicSlug: "xyz789" })
    );

    render(<ArchiveVisibilityToggle archiveId="archive-1" initialIsPublic={false} initialSlug={null} />);
    await user.click(screen.getByRole("button", { name: /Make Public/ }));

    expect(await screen.findByRole("button", { name: /^Public$/ })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Archive is now public.");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/archives/archive-1/visibility",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("shows an error toast when the visibility update fails", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(makeFetchResponse(null, { ok: false, status: 500 }));

    render(<ArchiveVisibilityToggle archiveId="archive-1" initialIsPublic={false} initialSlug={null} />);
    await user.click(screen.getByRole("button", { name: /Make Public/ }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong updating this archive's visibility.")
    );
  });
});
