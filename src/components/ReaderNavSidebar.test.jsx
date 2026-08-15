import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession } from "@/test/fixtures";

let mockSession = null;
let mockPathname = "/news";
const signOut = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
  signOut: (...args) => signOut(...args),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const unreadCounts = { value: { categories: {}, feeds: 0, following: 0 } };
vi.mock("@/lib/useUnreadCounts", () => ({ useUnreadCounts: () => unreadCounts.value }));

const { default: ReaderNavSidebar } = await import("./ReaderNavSidebar");

describe("ReaderNavSidebar", () => {
  beforeEach(() => {
    unreadCounts.value = { categories: {}, feeds: 0, following: 0 };
    signOut.mockClear();
  });

  it("hides subscriber-only top links but always shows categories (with a lock badge) for a Free user", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<ReaderNavSidebar />);

    expect(screen.getByRole("link", { name: /All Articles/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /For You/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /My Feeds/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Journals/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Journals/ }).querySelector('[aria-label="Subscribers only"]')
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Business/ })).toBeInTheDocument();
  });

  it("shows subscriber-only top links and no lock badge on categories for a Subscribed user", () => {
    mockSession = makeSession({ tier: "Subscribed" });
    mockPathname = "/news";
    render(<ReaderNavSidebar />);

    expect(screen.getByRole("link", { name: /For You/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /My Feeds/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Journals/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Journals/ }).querySelector('[aria-label="Subscribers only"]')
    ).not.toBeInTheDocument();
  });

  it("marks the link matching the current pathname as active", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/archives";
    render(<ReaderNavSidebar />);

    expect(screen.getByRole("link", { name: /Archives/ }).className).toMatch(/active/);
    expect(screen.getByRole("link", { name: /All Articles/ }).className).not.toMatch(/active/);
  });

  it("always shows Following, not gated behind a subscription", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<ReaderNavSidebar />);
    expect(screen.getByRole("link", { name: /Following/ })).toHaveAttribute("href", "/following");
  });

  it("shows Liked Articles and Archives links even when signed out", () => {
    mockSession = null;
    mockPathname = "/news";
    render(<ReaderNavSidebar />);
    expect(screen.getByRole("link", { name: /Liked Articles/ })).toHaveAttribute("href", "/liked");
    expect(screen.getByRole("link", { name: /Archives/ })).toHaveAttribute("href", "/archives");
  });

  it("shows unread-count badges on My Feeds, Following, and categories for a signed-in user", () => {
    mockSession = makeSession({ tier: "Subscribed" });
    mockPathname = "/news";
    unreadCounts.value = { categories: { business: 3, tech: 150 }, feeds: 7, following: 2 };
    render(<ReaderNavSidebar />);

    expect(screen.getByRole("link", { name: /My Feeds/ })).toHaveTextContent("7");
    expect(screen.getByRole("link", { name: /Following/ })).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: /Business/ })).toHaveTextContent("3");
    // Capped display at 99+, matching the old HeaderNavBar convention.
    expect(screen.getByRole("link", { name: /Tech/ })).toHaveTextContent("99+");
  });

  it("does not show unread-count badges for a signed-out visitor", () => {
    mockSession = null;
    mockPathname = "/news";
    unreadCounts.value = { categories: { business: 3 }, feeds: 7, following: 2 };
    render(<ReaderNavSidebar />);

    expect(screen.getByRole("link", { name: /Business/ })).not.toHaveTextContent("3");
  });

  it("shows the account section and log out button for a signed-in user", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<ReaderNavSidebar />);

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Profile/ })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: /Liked Articles/ })).toHaveAttribute("href", "/liked");
    expect(screen.getByRole("link", { name: /Premium/ })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("link", { name: /Subscription & Billing/ })).toHaveAttribute(
      "href",
      "/account/subscription"
    );
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("button", { name: /Log Out/ })).toBeInTheDocument();
  });

  it("hides the account section for a signed-out visitor", () => {
    mockSession = null;
    mockPathname = "/news";
    render(<ReaderNavSidebar />);

    expect(screen.queryByText("Account")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Log Out/ })).not.toBeInTheDocument();
  });

  it("logs out when Log Out is clicked", async () => {
    const user = userEvent.setup();
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<ReaderNavSidebar />);

    await user.click(screen.getByRole("button", { name: /Log Out/ }));

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
