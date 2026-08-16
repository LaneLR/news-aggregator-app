import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

let mockSession = { user: { selectedTheme: null } };
const update = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, update }),
}));

const { default: ThemeSelector } = await import("./ThemeSelector");

describe("ThemeSelector", () => {
  beforeEach(() => {
    update.mockClear();
  });

  it("marks 'Auto' active when selectedTheme is null", () => {
    mockSession = { user: { selectedTheme: null } };
    render(<ThemeSelector />);
    expect(screen.getByRole("button", { name: /Auto/ }).className).toMatch(/active/);
  });

  it("marks 'Dark' active when selectedTheme is 'dark'", () => {
    mockSession = { user: { selectedTheme: "dark" } };
    render(<ThemeSelector />);
    const darkButton = screen.getByRole("button", { name: /^Dark/ });
    // className includes a hashed "active" class — assert via substring match.
    expect(darkButton.className).toMatch(/active/);
  });

  it("PATCHes the theme and calls update() when a swatch is clicked", async () => {
    mockSession = { user: { selectedTheme: null } };
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
    const user = userEvent.setup();

    render(<ThemeSelector />);
    await user.click(screen.getByRole("button", { name: /^Dark/ }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/theme",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ themeName: "dark" }),
      })
    );
    expect(update).toHaveBeenCalledWith({ selectedTheme: "dark" });
  });

  it("PATCHes null when the 'Auto' swatch is clicked", async () => {
    mockSession = { user: { selectedTheme: "dark" } };
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
    const user = userEvent.setup();

    render(<ThemeSelector />);
    await user.click(screen.getByRole("button", { name: /Auto/ }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/theme",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ themeName: null }),
      })
    );
    expect(update).toHaveBeenCalledWith({ selectedTheme: null });
  });

  it("PATCHes 'default' when the 'Light' swatch is clicked", async () => {
    mockSession = { user: { selectedTheme: "dark" } };
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
    const user = userEvent.setup();

    render(<ThemeSelector />);
    await user.click(screen.getByRole("button", { name: /^Light/ }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/theme",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ themeName: "default" }),
      })
    );
    expect(update).toHaveBeenCalledWith({ selectedTheme: "default" });
  });

  it("logs an error and does not throw when the PATCH fails", async () => {
    mockSession = { user: { selectedTheme: null } };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error("network down"));
    const user = userEvent.setup();

    render(<ThemeSelector />);
    await user.click(screen.getByRole("button", { name: /^Dark/ }));

    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(update).not.toHaveBeenCalled();
  });
});
