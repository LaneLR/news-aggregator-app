import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/LikedArticlesPage", () => ({
  default: () => <div data-testid="liked-articles-page" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: LikedPage, metadata } = await import("./page");

describe("LikedPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(LikedPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("renders LikedArticlesPage for an authenticated user", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const element = await LikedPage();
    render(element);

    expect(screen.getByTestId("liked-articles-page")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
