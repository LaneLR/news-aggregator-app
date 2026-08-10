import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/OnboardingFlow", () => ({
  default: () => <div data-testid="onboarding-flow" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: OnboardingPage, metadata } = await import("./page");

describe("OnboardingPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(OnboardingPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects to /news when onboarding is already completed", async () => {
    mockAuth.mockResolvedValue(makeSession({ onboardingCompleted: true }));

    await expect(OnboardingPage()).rejects.toThrow("REDIRECT:/news");
  });

  it("renders OnboardingFlow when onboarding isn't completed yet", async () => {
    mockAuth.mockResolvedValue(makeSession({ onboardingCompleted: false }));

    const element = await OnboardingPage();
    render(element);

    expect(screen.getByTestId("onboarding-flow")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
