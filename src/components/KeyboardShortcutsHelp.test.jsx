import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_KEYBOARD_SHORTCUTS } from "@/lib/keyboardShortcuts";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";

describe("KeyboardShortcutsHelp", () => {
  it("renders the dialog with a shortcut list", () => {
    render(<KeyboardShortcutsHelp shortcuts={DEFAULT_KEYBOARD_SHORTCUTS} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: /keyboard shortcuts/i })).toBeInTheDocument();
    expect(screen.getByText("Next article")).toBeInTheDocument();
    expect(screen.getByText("j")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<KeyboardShortcutsHelp shortcuts={DEFAULT_KEYBOARD_SHORTCUTS} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<KeyboardShortcutsHelp shortcuts={DEFAULT_KEYBOARD_SHORTCUTS} onClose={onClose} />);

    await user.click(screen.getByRole("dialog").parentElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<KeyboardShortcutsHelp shortcuts={DEFAULT_KEYBOARD_SHORTCUTS} onClose={onClose} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the dialog itself", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<KeyboardShortcutsHelp shortcuts={DEFAULT_KEYBOARD_SHORTCUTS} onClose={onClose} />);

    await user.click(screen.getByText("Next article"));

    expect(onClose).not.toHaveBeenCalled();
  });
});
