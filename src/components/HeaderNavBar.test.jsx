import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

// Note: role-based queries (getByRole("link", {...})) are unreliable for
// multi-link nav components with lucide icons + CSS-module classnames in
// this test environment — see the comment in MobileTabBar.test.jsx for the
// full explanation. Text + closest("a") queries are used here instead.
let mockSession = null;
let mockPathname = "/news";
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockSession ? "authenticated" : "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const { default: HeaderNavBar } = await import("./HeaderNavBar");

describe("HeaderNavBar", () => {
  it("always shows the 'All Articles' link", () => {
    mockSession = null;
    mockPathname = "/news";
    render(<HeaderNavBar />);
    expect(screen.getByText("All Articles").closest("a")).toHaveAttribute("href", "/news");
  });

  it("hides personal links (Following, My Feeds) when logged out", () => {
    mockSession = null;
    render(<HeaderNavBar />);
    expect(screen.queryByText("Following")).not.toBeInTheDocument();
    expect(screen.queryByText("My Feeds")).not.toBeInTheDocument();
  });

  it("shows Following (not subscriber-only) but hides My Feeds for a free logged-in user", () => {
    mockSession = makeSession({ tier: "Free" });
    render(<HeaderNavBar />);
    expect(screen.getByText("Following").closest("a")).toHaveAttribute("href", "/following");
    expect(screen.queryByText("My Feeds")).not.toBeInTheDocument();
  });

  it("shows My Feeds for a subscribed user", () => {
    mockSession = makeSession({ tier: "Subscribed" });
    render(<HeaderNavBar />);
    expect(screen.getByText("My Feeds").closest("a")).toHaveAttribute("href", "/feeds");
  });

  it("hides subscriber-only categories (Market, Journals, Finance) for a free user", () => {
    mockSession = makeSession({ tier: "Free" });
    render(<HeaderNavBar />);
    expect(screen.queryByText("Market")).not.toBeInTheDocument();
    expect(screen.queryByText("Journals")).not.toBeInTheDocument();
  });

  it("shows primary categories directly and puts overflow behind a 'More' button", () => {
    mockSession = null;
    render(<HeaderNavBar />);
    // Business/Tech/Science/Sports are `primary: true` and free — visible directly.
    expect(screen.getByText("Business").closest("a")).toHaveAttribute("href", "/category/business");
    // Health is not `primary` — lives behind "More" instead.
    expect(screen.queryByText("Health")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /more/i })).toBeInTheDocument();
  });

  it("marks the current category link as active", () => {
    mockSession = null;
    mockPathname = "/category/business";
    render(<HeaderNavBar />);
    expect(screen.getByText("Business").closest("a").className).toMatch(/active/);
  });
});
