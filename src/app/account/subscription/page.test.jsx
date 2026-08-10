import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/ManageSubscriptionButton", () => ({
  default: () => <button>Manage subscription</button>,
}));
vi.mock("@/components/CancelSubscriptionButton", () => ({
  default: () => <button>Cancel subscription</button>,
}));
vi.mock("@/components/ResumeSubscriptionButton", () => ({
  default: ({ subscriptionEndDate }) => (
    <button data-end={subscriptionEndDate}>Resume subscription</button>
  ),
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: SubscriptionPage, metadata } = await import("./page");

describe("SubscriptionPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(SubscriptionPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("shows the Free plan and an upgrade link for Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));

    const element = await SubscriptionPage();
    render(element);

    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("View plans")).toBeInTheDocument();
    expect(screen.queryByText("Manage subscription")).not.toBeInTheDocument();
  });

  it("shows plan/status/renewal details and manage/cancel buttons for subscribed users", async () => {
    mockAuth.mockResolvedValue(
      makeSession({
        tier: "Subscribed",
        stripeSubscriptionStatus: "active",
        stripeSubscriptionEndsAt: "2026-12-01T00:00:00.000Z",
        subscriptionWillCancel: false,
      })
    );

    const element = await SubscriptionPage();
    render(element);

    expect(screen.getByText("Subscribed")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("Renews on")).toBeInTheDocument();
    expect(screen.getByText("Manage subscription")).toBeInTheDocument();
    expect(screen.getByText("Cancel subscription")).toBeInTheDocument();
    expect(screen.queryByText("Resume subscription")).not.toBeInTheDocument();
  });

  it("shows Resume instead of Cancel when the subscription is set to cancel", async () => {
    mockAuth.mockResolvedValue(
      makeSession({
        tier: "Subscribed",
        stripeSubscriptionStatus: "active",
        stripeSubscriptionEndsAt: "2026-12-01T00:00:00.000Z",
        subscriptionWillCancel: true,
      })
    );

    const element = await SubscriptionPage();
    render(element);

    expect(screen.getByText("Cancels on")).toBeInTheDocument();
    expect(screen.getByText("Resume subscription")).toBeInTheDocument();
    expect(screen.queryByText("Cancel subscription")).not.toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
