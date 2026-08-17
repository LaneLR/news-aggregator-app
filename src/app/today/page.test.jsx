import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/TodayPage", () => ({
  default: () => <div data-testid="today-page" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: TodayNewsPage, metadata } = await import("./page");

describe("TodayNewsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects anonymous visitors home", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(TodayNewsPage()).rejects.toThrow("REDIRECT:/");
  });

  it("renders TodayPage for any signed-in user, including Free tier", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const element = await TodayNewsPage();
    render(element);

    expect(screen.getByTestId("today-page")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
