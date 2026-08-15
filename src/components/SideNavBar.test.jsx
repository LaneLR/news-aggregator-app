import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const signOut = vi.fn();
vi.mock("next-auth/react", () => ({
  signOut: (...args) => signOut(...args),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
}));

const { default: SideNavBar } = await import("./SideNavBar");

describe("SideNavBar", () => {
  it("renders a link for every account nav destination", () => {
    render(<SideNavBar />);
    ["Profile", "Liked Articles", "Subscription & Billing", "Settings"].forEach((label) => {
      expect(screen.getByRole("link", { name: new RegExp(label) })).toBeInTheDocument();
    });
  });

  it("calls signOut with a redirect to /login when Log Out is clicked", async () => {
    const user = userEvent.setup();
    render(<SideNavBar />);

    await user.click(screen.getByRole("button", { name: /Log Out/ }));

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
