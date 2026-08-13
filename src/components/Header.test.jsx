import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

// Note: role-based link queries are unreliable for multi-link/icon nav
// groups in this test environment — see MobileTabBar.test.jsx's comment.
// Text/title-based queries + closest("a") are used instead.
let mockSession = null;
let mockStatus = "unauthenticated";
const push = vi.fn();
const update = vi.fn();
const signOut = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus, update }),
  signOut: (...args) => signOut(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  // Header renders HeaderNavBar and SearchBar under the hood, both of which
  // call usePathname() directly.
  usePathname: () => "/news",
}));

const { default: Header } = await import("./Header");

describe("Header", () => {
  beforeEach(() => {
    mockSession = null;
    mockStatus = "unauthenticated";
    push.mockClear();
    update.mockClear();
    signOut.mockClear();
    global.fetch.mockImplementation((url) =>
      Promise.reject(new Error(`Unmocked fetch: ${url}`))
    );
  });

  it("renders a neutral shell while the session is loading", () => {
    mockStatus = "loading";
    const { container } = render(<Header />);
    expect(container.querySelector('[class*="headerShimmer"]')).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /log in/i })).not.toBeInTheDocument();
  });

  it("shows a 'Log in' button when logged out", () => {
    mockStatus = "unauthenticated";
    render(<Header />);
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });

  it("shows the search bar and icon group when logged in", () => {
    mockSession = makeSession();
    mockStatus = "authenticated";
    render(<Header />);
    expect(screen.getByRole("combobox", { name: /search articles/i })).toBeInTheDocument();
    expect(screen.getByTitle("News").closest("a")).toHaveAttribute("href", "/news");
    expect(screen.getByTitle("Archives").closest("a")).toHaveAttribute("href", "/archives");
  });

  it("shows the weather widget trigger between the search bar and icon group when logged in", () => {
    mockSession = makeSession();
    mockStatus = "authenticated";
    render(<Header />);
    expect(screen.getByRole("button", { name: /add your location/i })).toBeInTheDocument();
  });

  it("opens the account dropdown menu and navigates on item click", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    mockStatus = "authenticated";
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /settings/i }));

    expect(push).toHaveBeenCalledWith("/settings");
  });

  it("logs out when 'Log out' is clicked in the dropdown", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    mockStatus = "authenticated";
    signOut.mockResolvedValue(undefined);
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    await user.click(screen.getByRole("menuitem", { name: /log out/i }));

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("toggles the theme and persists it via the API", async () => {
    const user = userEvent.setup();
    mockSession = makeSession({ selectedTheme: "default" });
    mockStatus = "authenticated";
    global.fetch.mockImplementation((url, opts) => {
      if (url === "/api/users/theme" && opts?.method === "PATCH") {
        return Promise.resolve(makeFetchResponse({ success: true }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
    render(<Header />);

    await user.click(screen.getByTitle("Toggle light/dark theme"));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/users/theme",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ themeName: "dark" }),
        })
      )
    );
    expect(update).toHaveBeenCalledWith({ selectedTheme: "dark" });
  });

  it("closes the dropdown when clicking outside of it", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    mockStatus = "authenticated";
    render(<Header />);

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
