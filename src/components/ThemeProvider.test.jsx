import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));

const { default: ThemeProvider } = await import("./ThemeProvider");

describe("ThemeProvider", () => {
  it("removes the data-theme attribute when no theme is selected (follow system)", () => {
    mockSession = null;
    document.documentElement.setAttribute("data-theme", "dark");

    render(<ThemeProvider>child</ThemeProvider>);

    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });

  it("sets data-theme to the session's selectedTheme", () => {
    mockSession = { user: { selectedTheme: "dark" } };

    render(<ThemeProvider>child</ThemeProvider>);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("renders its children", () => {
    mockSession = null;
    const { getByText } = render(<ThemeProvider>hello world</ThemeProvider>);
    expect(getByText("hello world")).toBeInTheDocument();
  });
});
