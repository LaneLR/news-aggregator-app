import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));

const {
  default: KeyboardShortcutsProvider,
  useKeyboardShortcuts,
  isTypingTarget,
} = await import("./KeyboardShortcutsProvider");

function Consumer() {
  const { shortcuts } = useKeyboardShortcuts();
  return <div data-testid="help-key">{shortcuts.help}</div>;
}

describe("isTypingTarget", () => {
  it("returns true for inputs, textareas, and contentEditable elements", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    // jsdom doesn't compute isContentEditable from the contenteditable
    // attribute the way a real browser does, so it's stubbed directly here
    // to exercise the isContentEditable branch of isTypingTarget.
    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    const div = document.createElement("div");
    Object.defineProperty(div, "isContentEditable", { value: false });

    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(textarea)).toBe(true);
    expect(isTypingTarget(editable)).toBe(true);
    expect(isTypingTarget(div)).toBe(false);
  });
});

describe("KeyboardShortcutsProvider", () => {
  it("provides the default shortcuts immediately for a logged-out session", () => {
    mockSession = null;
    render(
      <KeyboardShortcutsProvider>
        <Consumer />
      </KeyboardShortcutsProvider>
    );
    expect(screen.getByTestId("help-key")).toHaveTextContent("?");
  });

  it("upgrades to the signed-in user's saved shortcuts after fetching", async () => {
    mockSession = makeSession();
    global.fetch.mockImplementation((url) => {
      if (url === "/api/users/keyboard-shortcuts") {
        return Promise.resolve(
          makeFetchResponse({ keyboardShortcuts: { next: "n", prev: "p", open: "o", save: "s", like: "l", search: "/", help: "h" } })
        );
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });

    render(
      <KeyboardShortcutsProvider>
        <Consumer />
      </KeyboardShortcutsProvider>
    );

    expect(await screen.findByText("h")).toBeInTheDocument();
  });

  it("opens the help dialog when the configured help key is pressed", async () => {
    mockSession = null;
    const user = userEvent.setup();
    render(
      <KeyboardShortcutsProvider>
        <p>App content</p>
      </KeyboardShortcutsProvider>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.keyboard("?");

    expect(screen.getByRole("dialog", { name: /keyboard shortcuts/i })).toBeInTheDocument();
  });

  it("ignores the help key while typing in an input", async () => {
    mockSession = null;
    const user = userEvent.setup();
    render(
      <KeyboardShortcutsProvider>
        <input aria-label="Search" />
      </KeyboardShortcutsProvider>
    );

    await user.click(screen.getByLabelText("Search"));
    await user.keyboard("?");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
