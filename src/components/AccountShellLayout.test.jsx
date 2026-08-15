import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/account",
  useSearchParams: () => new URLSearchParams(),
}));

const { default: AccountShellLayout } = await import("./AccountShellLayout");

describe("AccountShellLayout", () => {
  it("renders the sidebar navigation alongside its children", async () => {
    render(
      <AccountShellLayout>
        <p>Account content</p>
      </AccountShellLayout>
    );
    expect(await screen.findByText("Account content")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Profile/ })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: /Liked Articles/ })).toHaveAttribute("href", "/liked");
  });
});
