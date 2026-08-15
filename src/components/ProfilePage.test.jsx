import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

let mockSession = null;
let mockStatus = "unauthenticated";
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus }),
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
vi.mock("./DigestSettings", () => ({
  default: () => <div data-testid="digest-settings">DigestSettings</div>,
}));
vi.mock("./AccountTabs", () => ({
  default: () => <div data-testid="account-tabs" />,
}));

const { default: ProfilePage } = await import("./ProfilePage");

describe("ProfilePage", () => {
  beforeEach(() => {
    mockSession = null;
    mockStatus = "unauthenticated";
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

  it("does not show the referral-count line for a subscriber with zero referrals", () => {
    mockSession = makeSession({ tier: "Subscribed", referralCount: 0, referralCode: "REF000" });
    mockStatus = "authenticated";
    render(<ProfilePage />);
    expect(screen.queryByText(/Users referred:/)).not.toBeInTheDocument();
  });

  it("shows a 'Member since' date derived from the account's creation date", () => {
    mockSession = makeSession({ tier: "Free", createdAt: "2025-03-14T00:00:00.000Z" });
    mockStatus = "authenticated";
    render(<ProfilePage />);
    expect(screen.getByText("Member since March 2025")).toBeInTheDocument();
  });

  it("shows quick links to Settings, Pricing, and Contact Us", () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("link", { name: /Plans & Pricing/ })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("link", { name: /Contact Us/ })).toHaveAttribute("href", "/contact-us");
  });

  it("has no account-deletion UI", () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    expect(screen.queryByRole("button", { name: /Delete Account/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/scheduled for deletion/i)).not.toBeInTheDocument();
  });

  it("keeps the #privacy anchor target Settings deep-links to", () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    const { container } = render(<ProfilePage />);
    expect(container.querySelector("#privacy")).toBeInTheDocument();
  });

  it("shows a Security card with a Change Password link to /forgot-password", () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change Password" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  it("shows an Email Preferences card", () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    expect(screen.getByText("Email Preferences")).toBeInTheDocument();
    expect(screen.getByTestId("digest-settings")).toBeInTheDocument();
  });

  it("shows the Profile/Settings account tabs", () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    render(<ProfilePage />);

    expect(screen.getByTestId("account-tabs")).toBeInTheDocument();
  });
});
