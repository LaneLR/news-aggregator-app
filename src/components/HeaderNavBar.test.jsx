import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession } from "@/test/fixtures";

const unreadCounts = { value: { categories: {}, feeds: 0, following: 0 } };
vi.mock("@/lib/useUnreadCounts", () => ({ useUnreadCounts: () => unreadCounts.value }));

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
  beforeEach(() => {
    unreadCounts.value = { categories: {}, feeds: 0, following: 0 };
  });

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
    // Lifestyle is not `primary` — lives behind "More" instead.
    expect(screen.queryByText("Lifestyle")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /more/i })).toBeInTheDocument();
  });

  it("marks the current category link as active", () => {
    mockSession = null;
    mockPathname = "/category/business";
    render(<HeaderNavBar />);
    expect(screen.getByText("Business").closest("a").className).toMatch(/active/);
  });

  it("opens the More menu, shows overflow categories, and closes on an outside click", async () => {
    const user = userEvent.setup();
    mockSession = null;
    mockPathname = "/news";
    render(<HeaderNavBar />);

    await user.click(screen.getByRole("button", { name: /more/i }));
    expect(screen.getByText("Lifestyle").closest("a")).toHaveAttribute("href", "/category/lifestyle");

    await user.click(document.body);
    await waitFor(() => expect(screen.queryByText("Lifestyle")).not.toBeInTheDocument());
  });

  it("closes the More menu when a menu item is clicked", async () => {
    const user = userEvent.setup();
    mockSession = null;
    mockPathname = "/news";
    render(<HeaderNavBar />);

    await user.click(screen.getByRole("button", { name: /more/i }));
    await user.click(screen.getByText("Lifestyle"));

    await waitFor(() => expect(screen.queryByText("Lifestyle")).not.toBeInTheDocument());
  });

  it("closes the More menu on window resize and on scroll", async () => {
    const user = userEvent.setup();
    mockSession = null;
    mockPathname = "/news";
    render(<HeaderNavBar />);

    await user.click(screen.getByRole("button", { name: /more/i }));
    expect(screen.getByText("Lifestyle")).toBeInTheDocument();
    fireEvent(window, new Event("resize"));
    await waitFor(() => expect(screen.queryByText("Lifestyle")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /more/i }));
    expect(screen.getByText("Lifestyle")).toBeInTheDocument();
    fireEvent(window, new Event("scroll"));
    await waitFor(() => expect(screen.queryByText("Lifestyle")).not.toBeInTheDocument());
  });

  it("shows unread-count badges on personal links, primary categories, and the More button", () => {
    mockSession = makeSession({ tier: "Subscribed" });
    mockPathname = "/news";
    unreadCounts.value = { categories: { business: 3, lifestyle: 150 }, feeds: 7, following: 2 };
    render(<HeaderNavBar />);

    expect(screen.getByText("Following").closest("a")).toHaveTextContent("2");
    expect(screen.getByText("My Feeds").closest("a")).toHaveTextContent("7");
    expect(screen.getByText("Business").closest("a")).toHaveTextContent("3");
    // Lifestyle (150, capped display) is in the overflow "More" menu — its
    // count rolls up into the More button's own badge, capped at "99+".
    expect(screen.getByRole("button", { name: /more/i })).toHaveTextContent("99+");
  });

  it("reorders primary categories via drag-and-drop for a signed-in user", () => {
    localStorage.removeItem("morningfeeds:categoryOrder");
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<HeaderNavBar />);

    const first = screen.getByText("Business").closest("a");
    const second = screen.getByText("Tech").closest("a");

    fireEvent.dragStart(first, { dataTransfer: {} });
    fireEvent.dragOver(second, { dataTransfer: {} });
    fireEvent.drop(second, { dataTransfer: {} });
    fireEvent.dragEnd(first);

    const saved = JSON.parse(localStorage.getItem("morningfeeds:categoryOrder"));
    expect(saved[0]).toBe("/category/tech");
  });

  it("does not make primary categories draggable for a signed-out user", () => {
    mockSession = null;
    mockPathname = "/news";
    render(<HeaderNavBar />);
    expect(screen.getByText("Business").closest("a")).not.toHaveAttribute("draggable");
  });
});
