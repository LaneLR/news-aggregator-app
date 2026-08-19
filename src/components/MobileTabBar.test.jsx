import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

// Note: role-based queries (getByRole("link", {...})) are unreliable for this
// component in this test environment — a combination of multiple sibling
// <Link>s, lucide icons, and CSS-module classnames on the same element
// somehow makes @testing-library/dom's accessible-role computation report
// zero links even though the anchors are present and correct (confirmed via
// container.querySelectorAll("a")). Querying by visible text and asserting
// on the closest <a>'s href/className sidesteps the role computation
// entirely and is used throughout this file instead.
let mockSession = null;
let mockPathname = "/news";
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const { default: MobileTabBar } = await import("./MobileTabBar");

describe("MobileTabBar", () => {
  it("renders nothing when logged out", () => {
    mockSession = null;
    const { container } = render(<MobileTabBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the Liked tab (not For You) for a Free user", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<MobileTabBar />);

    expect(screen.getByText("Liked").closest("a")).toHaveAttribute("href", "/liked");
    expect(screen.queryByText("For You")).not.toBeInTheDocument();
  });

  it("shows the For You tab (not Liked) for a subscribed user", () => {
    mockSession = makeSession({ tier: "Subscribed" });
    mockPathname = "/news";
    render(<MobileTabBar />);

    expect(screen.getByText("For You").closest("a")).toHaveAttribute("href", "/for-you");
    expect(screen.queryByText("Liked")).not.toBeInTheDocument();
  });

  it("has no Search tab — the header's own search bar is the entry point", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<MobileTabBar />);

    expect(screen.queryByText("Search")).not.toBeInTheDocument();
  });

  it("marks the tab matching the current path as active", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<MobileTabBar />);

    expect(screen.getByText("Home").closest("a").className).toMatch(/active/);
    expect(screen.getByText("Account").closest("a").className).not.toMatch(/active/);
  });
});
