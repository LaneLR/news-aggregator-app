import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/FollowingPage", () => ({
  default: () => <div data-testid="following-page" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: Following, metadata } = await import("./page");

describe("Following page", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(Following()).rejects.toThrow("REDIRECT:/login");
  });

  it("renders FollowingPage for an authenticated user", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const element = await Following();
    render(element);

    expect(screen.getByTestId("following-page")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
