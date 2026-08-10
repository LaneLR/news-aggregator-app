import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession } from "@/test/fixtures";

let mockSession = null;
let mockStatus = "unauthenticated";
const update = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus, update }),
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

  it("shows subscription details and a Manage Subscription button for a subscribed user", () => {
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
    expect(screen.getByRole("button", { name: "Manage Subscription" })).toBeInTheDocument();
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
});
