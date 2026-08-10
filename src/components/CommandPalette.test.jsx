import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSession = { value: null };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession.value, status: mockSession.value ? "authenticated" : "unauthenticated" }),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));

const { default: CommandPalette } = await import("./CommandPalette");

describe("CommandPalette", () => {
  beforeEach(() => {
    mockSession.value = null;
    pushMock.mockClear();
  });

  it("stays hidden until Ctrl/Cmd+K is pressed", () => {
    render(<CommandPalette />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides subscriber-only destinations for a Free-tier session", () => {
    mockSession.value = { user: { tier: "Free" } };
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    expect(screen.queryByText("Journals")).not.toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
  });

  it("shows subscriber-only destinations for a subscribed session", () => {
    mockSession.value = { user: { tier: "Plus" } };
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    expect(screen.getByText("Journals")).toBeInTheDocument();
  });

  it("filters destinations as the user types", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    await user.type(screen.getByRole("combobox"), "settings");
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.queryByText("Business")).not.toBeInTheDocument();
  });

  it("falls back to article search when nothing matches", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    await user.type(screen.getByRole("combobox"), "zzzznomatch");
    expect(screen.getByText(/Search articles for/)).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/search?query=zzzznomatch");
  });

  it("navigates to the active option's destination on Enter", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    await user.type(screen.getByRole("combobox"), "settings");
    await user.keyboard("{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/settings");
  });

  it("moves the active selection with ArrowDown/ArrowUp", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    const combobox = screen.getByRole("combobox");
    const firstOptionId = combobox.getAttribute("aria-activedescendant");
    await user.type(combobox, "{ArrowDown}");
    const secondOptionId = combobox.getAttribute("aria-activedescendant");
    expect(secondOptionId).not.toBe(firstOptionId);

    await user.type(combobox, "{ArrowUp}");
    expect(combobox.getAttribute("aria-activedescendant")).toBe(firstOptionId);
  });

  it("navigates to a destination on click", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    await user.click(screen.getByText("Settings"));
    expect(pushMock).toHaveBeenCalledWith("/settings");
  });
});
