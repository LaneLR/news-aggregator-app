import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/FeedManager", () => ({
  default: () => <div data-testid="feed-manager" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: FeedsPage, metadata } = await import("./page");

describe("FeedsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects anonymous visitors to /pricing", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(FeedsPage()).rejects.toThrow("REDIRECT:/pricing");
  });

  it("redirects Free-tier users to /pricing", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    await expect(FeedsPage()).rejects.toThrow("REDIRECT:/pricing");
  });

  it("renders FeedManager for subscribed users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const element = await FeedsPage();
    render(element);

    expect(screen.getByTestId("feed-manager")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
