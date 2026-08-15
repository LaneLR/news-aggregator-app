import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession } from "@/test/fixtures";

let mockSession = null;
let mockStatus = "unauthenticated";
const update = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus, update }),
}));

// Each has its own dedicated test file covering its internal fetch/error
// behavior — this file only tests ProfilePage's own composition (which
// button shows in which subscription state), not their internals.
vi.mock("./ManageSubscriptionButton", () => ({
  default: () => <button>Manage Subscription</button>,
}));
vi.mock("./CancelSubscriptionButton", () => ({
  default: () => <button>Cancel Subscription</button>,
}));
vi.mock("./ResumeSubscriptionButton", () => ({
  default: ({ subscriptionEndDate }) => (
    <button data-end={subscriptionEndDate}>Resume Subscription</button>
  ),
}));

const { default: ProfilePage } = await import("./ProfilePage");

describe("ProfilePage", () => {
  beforeEach(() => {
    update.mockClear();
    localStorage.clear();
  });

  it("shows a loading state while the session loads", () => {
    mockSession = null;
    mockStatus = "loading";
    render(<ProfilePage />);
    expect(screen.queryByText(/Access Denied/)).not.toBeInTheDocument();
  });

  it("shows an access-denied message when unauthenticated", () => {
    mockSession = null;
    mockStatus = "unauthenticated";
    render(<ProfilePage />);
    expect(screen.getByText(/Access Denied/)).toBeInTheDocument();
  });

  it("shows the Free tier badge and an Upgrade button for a Free user", () => {
    mockSession = makeSession({ tier: "Free", name: "Jane Doe" });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    expect(screen.getByText("Free Tier")).toBeInTheDocument();
    expect(screen.getByText("You are currently on the Free plan.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeInTheDocument();
  });

  it("shows subscription details and Manage/Cancel buttons for a subscribed user", () => {
    mockSession = makeSession({
      tier: "Subscribed",
      stripeSubscriptionStatus: "active",
      stripeSubscriptionEndsAt: "2026-06-01T00:00:00.000Z",
      subscriptionWillCancel: false,
      referralCount: 3,
      referralCode: "REF999",
    });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    expect(screen.getAllByText("Subscribed").length).toBeGreaterThan(0);
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("Renews on")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage Subscription" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Subscription" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resume Subscription" })).not.toBeInTheDocument();
    expect(
      screen.getByText("Payment methods and billing history are managed securely through Stripe.")
    ).toBeInTheDocument();
    expect(screen.getByText("Users referred: 3")).toBeInTheDocument();
    expect(screen.getByText("REF999")).toBeInTheDocument();
  });

  it("switches between grid and list layout and persists the choice to localStorage", async () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByTitle("List view"));

    expect(localStorage.getItem("accountCardLayout")).toBe("list");
  });

  it("shows the pending-deletion notice and a Cancel Deletion button when isPendingDeletion is true", () => {
    mockSession = makeSession({ tier: "Free", isPendingDeletion: true });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    expect(screen.getByText(/scheduled for deletion/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Deletion" })).toBeInTheDocument();
  });

  it("requests account deletion and refreshes the session when Delete Account is clicked", async () => {
    mockSession = makeSession({ tier: "Free", isPendingDeletion: false });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole("button", { name: "Delete Account" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/request-deletion",
      expect.objectContaining({ method: "PATCH" })
    );
    await vi.waitFor(() => expect(update).toHaveBeenCalled());
  });

  it("cancels a scheduled deletion and refreshes the session", async () => {
    mockSession = makeSession({ tier: "Free", isPendingDeletion: true });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole("button", { name: "Cancel Deletion" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/cancel-deletion",
      expect.objectContaining({ method: "PATCH" })
    );
    await vi.waitFor(() => expect(update).toHaveBeenCalled());
  });

  it("shows 'Cancels on', a Resume button, and no Cancel button when subscriptionWillCancel is true", () => {
    mockSession = makeSession({
      tier: "Subscribed",
      stripeSubscriptionStatus: "active",
      stripeSubscriptionEndsAt: "2026-06-01T00:00:00.000Z",
      subscriptionWillCancel: true,
    });
    mockStatus = "authenticated";
    render(<ProfilePage />);
    expect(screen.getByText("Cancels on")).toBeInTheDocument();
    expect(screen.queryByText("Renews on")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resume Subscription" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Subscription" })).not.toBeInTheDocument();
    // Manage Subscription (billing portal access) stays available either way.
    expect(screen.getByRole("button", { name: "Manage Subscription" })).toBeInTheDocument();
  });

  it("falls back to the placeholder avatar when the profile image fails to load", () => {
    mockSession = makeSession({ tier: "Free", image: "https://example.com/avatar.jpg" });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    const img = screen.getByAltText("User profile image");
    expect(img.src).toContain(encodeURIComponent("/api/image-proxy"));

    fireEvent.error(img);

    expect(img.src).toContain(encodeURIComponent("/images/default-avatar.png"));
  });

  it("restores a previously-saved layout preference from localStorage", () => {
    localStorage.setItem("accountCardLayout", "list");
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    render(<ProfilePage />);
    expect(screen.getByTitle("List view").className).toMatch(/active/);
  });

  it("does not show the referral-count line for a subscriber with zero referrals", () => {
    mockSession = makeSession({ tier: "Subscribed", referralCount: 0, referralCode: "REF000" });
    mockStatus = "authenticated";
    render(<ProfilePage />);
    expect(screen.queryByText(/Users referred:/)).not.toBeInTheDocument();
  });
});
