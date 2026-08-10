import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: refreshMock, back: vi.fn() }),
}));

const { default: CreateNewArchiveCard } = await import("./CreateNewArchiveCard");

describe("CreateNewArchiveCard", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  it("opens the create-archive modal when clicked", async () => {
    const user = userEvent.setup();
    render(<CreateNewArchiveCard />);
    await user.click(screen.getByRole("button", { name: /Create New Archive/ }));
    expect(screen.getByRole("dialog", { name: "Create New Archive" })).toBeInTheDocument();
  });

  it("shows a validation error for an empty name instead of calling the API", async () => {
    const user = userEvent.setup();
    render(<CreateNewArchiveCard />);
    await user.click(screen.getByRole("button", { name: /Create New Archive/ }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Archive name cannot be empty.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("creates the archive and closes the modal on success", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ id: "archive-1" }));

    render(<CreateNewArchiveCard />);
    await user.click(screen.getByRole("button", { name: /Create New Archive/ }));
    await user.type(screen.getByLabelText("Archive name"), "My Reads");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a server-provided error message on failure", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ error: "Name already in use." }, { ok: false, status: 400 })
    );

    render(<CreateNewArchiveCard />);
    await user.click(screen.getByRole("button", { name: /Create New Archive/ }));
    await user.type(screen.getByLabelText("Archive name"), "Duplicate");
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Name already in use.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("closes the modal on Cancel and clears the name", async () => {
    const user = userEvent.setup();
    render(<CreateNewArchiveCard />);
    await user.click(screen.getByRole("button", { name: /Create New Archive/ }));
    await user.type(screen.getByLabelText("Archive name"), "Draft name");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
