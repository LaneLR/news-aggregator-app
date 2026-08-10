import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/HomePage", () => ({
  default: () => <div data-testid="home-page" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: LandingPage } = await import("./page");

describe("LandingPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects authenticated visitors to /news", async () => {
    mockAuth.mockResolvedValue(makeSession());

    await expect(LandingPage()).rejects.toThrow("REDIRECT:/news");
  });

  it("renders HomePage for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await LandingPage();
    render(element);

    expect(screen.getByTestId("home-page")).toBeInTheDocument();
  });
});
