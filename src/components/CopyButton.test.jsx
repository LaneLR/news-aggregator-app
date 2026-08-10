import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const { default: CopyButton } = await import("./CopyButton");

function stubClipboard(value) {
  Object.defineProperty(navigator, "clipboard", {
    value,
    configurable: true,
  });
}

describe("CopyButton", () => {
  beforeEach(() => {
    toast.error.mockClear();
  });

  it("copies the given text and shows 'Copied' feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });

    render(<CopyButton textToCopy="https://example.com/shared" />);
    fireEvent.click(screen.getByRole("button"));

    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith("https://example.com/shared");
  });

  it("reverts back to 'Copy' after the timeout", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });

    render(<CopyButton textToCopy="https://example.com/shared" />);
    fireEvent.click(screen.getByRole("button"));
    await screen.findByText("Copied");

    expect(await screen.findByText("Copy", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("shows an error toast when the Clipboard API is unavailable", async () => {
    stubClipboard(undefined);

    render(<CopyButton textToCopy="https://example.com/shared" />);
    fireEvent.click(screen.getByRole("button"));

    expect(toast.error).toHaveBeenCalledWith("Clipboard access isn't available in this browser.");
  });
});
