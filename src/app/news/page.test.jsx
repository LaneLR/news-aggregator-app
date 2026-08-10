import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/NewNewsPage", () => ({
  default: () => <div data-testid="news-page" />,
}));
vi.mock("../loading", () => ({
  default: () => <div data-testid="page-loading" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: Home } = await import("./page");

describe("News page (Home)", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects anonymous visitors to /", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(Home()).rejects.toThrow("REDIRECT:/");
  });

  it("redirects users who haven't completed onboarding to /onboarding", async () => {
    mockAuth.mockResolvedValue(makeSession({ onboardingCompleted: false }));

    await expect(Home()).rejects.toThrow("REDIRECT:/onboarding");
  });

  it("renders NewsPage for onboarded, authenticated users", async () => {
    mockAuth.mockResolvedValue(makeSession({ onboardingCompleted: true }));

    const element = await Home();
    render(element);

    expect(screen.getByTestId("news-page")).toBeInTheDocument();
  });
});
