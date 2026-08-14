import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockPathname = "/login";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const { default: AuthTabs } = await import("./AuthTabs");

describe("AuthTabs", () => {
  it("renders both tabs pointing at /login and /register", () => {
    render(<AuthTabs />);
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Create Account" })).toHaveAttribute("href", "/register");
  });

  it("marks Sign In active on /login", () => {
    mockPathname = "/login";
    render(<AuthTabs />);
    expect(screen.getByRole("link", { name: "Sign In" }).className).toContain("activeTab");
    expect(screen.getByRole("link", { name: "Create Account" }).className).not.toContain("activeTab");
  });

  it("marks Create Account active on /register", () => {
    mockPathname = "/register";
    render(<AuthTabs />);
    expect(screen.getByRole("link", { name: "Create Account" }).className).toContain("activeTab");
    expect(screen.getByRole("link", { name: "Sign In" }).className).not.toContain("activeTab");
  });
});
