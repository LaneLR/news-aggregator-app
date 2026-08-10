import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession } from "@/test/fixtures";

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));

const { default: SubscribeHeaderBanner } = await import("./SubscribeHeaderBanner");

describe("SubscribeHeaderBanner", () => {
  it("renders nothing for a subscribed user", () => {
    mockSession = makeSession({ tier: "Subscribed" });
    const { container } = render(<SubscribeHeaderBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a logged-out user (no session)", () => {
    mockSession = null;
    const { container } = render(<SubscribeHeaderBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the upgrade CTA for a Free-tier user", () => {
    mockSession = makeSession({ tier: "Free" });
    render(<SubscribeHeaderBanner />);
    expect(screen.getByText("Become a member!")).toBeInTheDocument();
  });

  it("dismisses the CTA and persists the dismissal to sessionStorage", async () => {
    mockSession = makeSession({ tier: "Free" });
    const user = userEvent.setup();
    render(<SubscribeHeaderBanner />);

    await user.click(screen.getByTitle("Dismiss"));

    expect(screen.queryByText("Become a member!")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("hideUpgradeCTA")).toBe("true");
  });

  it("stays hidden on mount if sessionStorage already recorded a dismissal", () => {
    mockSession = makeSession({ tier: "Free" });
    sessionStorage.setItem("hideUpgradeCTA", "true");

    render(<SubscribeHeaderBanner />);

    expect(screen.queryByText("Become a member!")).not.toBeInTheDocument();
  });
});
