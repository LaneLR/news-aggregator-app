import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockPathname = "/account";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const { default: AccountTabs } = await import("./AccountTabs");

describe("AccountTabs", () => {
  it("renders both tabs pointing at /account and /settings", () => {
    render(<AccountTabs />);
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
  });

  it("marks Profile active on /account", () => {
    mockPathname = "/account";
    render(<AccountTabs />);
    expect(screen.getByRole("link", { name: "Profile" }).className).toContain("activeTab");
    expect(screen.getByRole("link", { name: "Settings" }).className).not.toContain("activeTab");
  });

  it("marks Settings active on /settings", () => {
    mockPathname = "/settings";
    render(<AccountTabs />);
    expect(screen.getByRole("link", { name: "Settings" }).className).toContain("activeTab");
    expect(screen.getByRole("link", { name: "Profile" }).className).not.toContain("activeTab");
  });
});
