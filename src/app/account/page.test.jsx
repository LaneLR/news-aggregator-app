import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/ProfilePage", () => ({
  default: () => <div data-testid="profile-page" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: AccountPage, metadata } = await import("./page");

describe("AccountPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(AccountPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("renders ProfilePage for an authenticated user", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const element = await AccountPage();
    render(element);

    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
