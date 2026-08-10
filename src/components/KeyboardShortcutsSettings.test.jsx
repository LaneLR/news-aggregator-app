import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_KEYBOARD_SHORTCUTS } from "@/lib/keyboardShortcuts";
import { makeFetchResponse } from "@/test/fixtures";
import KeyboardShortcutsSettings from "./KeyboardShortcutsSettings";

function mockPatch(handler) {
  global.fetch.mockImplementation((url, opts) => {
    if (url === "/api/users/keyboard-shortcuts" && opts?.method === "PATCH") {
      return Promise.resolve(handler(JSON.parse(opts.body)));
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("KeyboardShortcutsSettings", () => {
  it("renders all shortcut actions with their current key", () => {
    render(<KeyboardShortcutsSettings initialShortcuts={DEFAULT_KEYBOARD_SHORTCUTS} />);
    expect(screen.getByText("Next article")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "j" })).toBeInTheDocument();
  });

  it("falls back to defaults when no initialShortcuts is given", () => {
    render(<KeyboardShortcutsSettings />);
    expect(screen.getByRole("button", { name: "j" })).toBeInTheDocument();
  });

  it("captures a new key and saves it", async () => {
    const user = userEvent.setup();
    mockPatch((body) => makeFetchResponse({ keyboardShortcuts: body.keyboardShortcuts }));
    render(<KeyboardShortcutsSettings initialShortcuts={DEFAULT_KEYBOARD_SHORTCUTS} />);

    await user.click(screen.getByRole("button", { name: "j" }));
    expect(screen.getByText(/press a key/i)).toBeInTheDocument();

    await user.keyboard("n");

    await waitFor(() => expect(screen.getByRole("button", { name: "n" })).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/keyboard-shortcuts",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("shows an error when the chosen key is already in use", async () => {
    const user = userEvent.setup();
    render(<KeyboardShortcutsSettings initialShortcuts={DEFAULT_KEYBOARD_SHORTCUTS} />);

    await user.click(screen.getByRole("button", { name: "j" })); // "next"
    await user.keyboard("k"); // already used for "prev"

    expect(screen.getByText(/"k" is already used for "Previous article"/i)).toBeInTheDocument();
    // The conflicting key is rejected — listening mode stays open rather
    // than silently reverting to the original "j" binding.
    expect(screen.getByText(/press a key/i)).toBeInTheDocument();
  });

  it("resets to defaults when Reset is clicked", async () => {
    const user = userEvent.setup();
    mockPatch(() => makeFetchResponse({ keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS }));
    render(
      <KeyboardShortcutsSettings initialShortcuts={{ ...DEFAULT_KEYBOARD_SHORTCUTS, next: "n" }} />
    );

    expect(screen.getByRole("button", { name: "n" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reset to defaults/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: "j" })).toBeInTheDocument());
  });
});
