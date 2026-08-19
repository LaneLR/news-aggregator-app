import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
let mockStatus = "unauthenticated";
let mockPathname = "/news";
const update = vi.fn();
const mockToggle = vi.fn();
let mockIsNavOpen = false;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus, update }),
}));
vi.mock("next/navigation", () => ({
  // Header renders SearchBar under the hood, which calls usePathname() and
  // useRouter() directly.
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("./MobileNavProvider", () => ({
  useMobileNav: () => ({ isOpen: mockIsNavOpen, toggle: mockToggle }),
}));

const { default: Header } = await import("./Header");

describe("Header", () => {
  beforeEach(() => {
    mockSession = null;
    mockStatus = "unauthenticated";
    mockPathname = "/news";
    mockIsNavOpen = false;
    update.mockClear();
    mockToggle.mockClear();
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

  it("preloads the logo — it's the one image on every page guaranteed to be above the fold", () => {
    mockStatus = "unauthenticated";
    render(<Header />);
    // A preloaded next/image omits the `loading` attribute entirely rather
    // than setting loading="eager".
    expect(screen.getByAltText("MochaReads logo")).not.toHaveAttribute("loading");
  });

  it("shows the search bar and theme toggle when logged in", () => {
    mockSession = makeSession();
    mockStatus = "authenticated";
    render(<Header />);
    expect(screen.getByRole("combobox", { name: /search articles/i })).toBeInTheDocument();
    expect(screen.getByTitle("Toggle light/dark theme")).toBeInTheDocument();
  });

  it("shows the weather widget trigger between the search bar and theme toggle when logged in", () => {
    mockSession = makeSession();
    mockStatus = "authenticated";
    render(<Header />);
    expect(screen.getByRole("button", { name: /add your location/i })).toBeInTheDocument();
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

  it("toggles from dark back to the default theme, showing the Sun icon while dark", async () => {
    const user = userEvent.setup();
    mockSession = makeSession({ selectedTheme: "dark" });
    mockStatus = "authenticated";
    global.fetch.mockImplementation((url, opts) => {
      if (url === "/api/users/theme" && opts?.method === "PATCH") {
        return Promise.resolve(makeFetchResponse({ success: true }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });
    render(<Header />);

    // Dark is the active theme, so the toggle shows the Sun icon (switch to
    // light) rather than the Moon.
    const toggle = screen.getByTitle("Toggle light/dark theme");
    expect(toggle.querySelector("svg")).toBeInTheDocument();

    await user.click(toggle);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/users/theme",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ themeName: "default" }),
        })
      )
    );
    expect(update).toHaveBeenCalledWith({ selectedTheme: "default" });
  });

  it("logs an error when persisting the toggled theme fails", async () => {
    const user = userEvent.setup();
    mockSession = makeSession({ selectedTheme: "default" });
    mockStatus = "authenticated";
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockImplementation((url) => Promise.reject(new Error(`network down: ${url}`)));
    render(<Header />);

    await user.click(screen.getByTitle("Toggle light/dark theme"));

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith("Failed to update theme", expect.any(Error))
    );
    expect(update).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("follows the OS color scheme when there is no explicit theme choice, and updates live on change", async () => {
    let changeHandler;
    const removeEventListener = vi.fn();
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true, // OS prefers dark
      media: query,
      addEventListener: (event, handler) => {
        if (event === "change") changeHandler = handler;
      },
      removeEventListener,
    }));

    mockSession = makeSession({ selectedTheme: null });
    mockStatus = "authenticated";
    const { unmount } = render(<Header />);

    // No explicit theme, OS prefers dark -> Sun icon shown (dark is current).
    expect(screen.getByTitle("Toggle light/dark theme").querySelector("svg")).toBeInTheDocument();

    // Simulate the OS switching to light mode while mounted.
    act(() => {
      changeHandler({ matches: false });
    });

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", changeHandler);
    window.matchMedia = originalMatchMedia;
  });

  // The hamburger is only visually shown below a 900px CSS media query
  // (see Header.module.scss's .menuButton) — jsdom's default viewport is
  // wider than that, so @testing-library/dom's getByRole excludes it as
  // "hidden" the same way it does for MobileTabBar's links (see that
  // file's own comment on this). Querying by aria-label directly sidesteps
  // the accessible-role/visibility computation instead of fighting it.
  it("shows a mobile menu button on a page that has a category sidebar to open", () => {
    mockSession = makeSession();
    mockStatus = "authenticated";
    mockPathname = "/news";
    const { container } = render(<Header />);
    expect(container.querySelector('[aria-label="Open menu"]')).toBeInTheDocument();
  });

  it("hides the mobile menu button on a page with no sidebar (e.g. pricing)", () => {
    mockSession = makeSession();
    mockStatus = "authenticated";
    mockPathname = "/pricing";
    const { container } = render(<Header />);
    expect(container.querySelector('[aria-label="Open menu"]')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label="Close menu"]')).not.toBeInTheDocument();
  });

  it("hides the mobile menu button while logged out on a marketing page", () => {
    mockStatus = "unauthenticated";
    mockPathname = "/login";
    const { container } = render(<Header />);
    expect(container.querySelector('[aria-label="Open menu"]')).not.toBeInTheDocument();
  });

  it("still shows the mobile menu button while logged out on a content page", () => {
    mockStatus = "unauthenticated";
    mockPathname = "/news";
    const { container } = render(<Header />);
    expect(container.querySelector('[aria-label="Open menu"]')).toBeInTheDocument();
  });

  it("toggles the mobile nav drawer when the menu button is clicked", async () => {
    const user = userEvent.setup();
    mockSession = makeSession();
    mockStatus = "authenticated";
    mockPathname = "/news";
    const { container } = render(<Header />);

    await user.click(container.querySelector('[aria-label="Open menu"]'));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("shows a close icon and label once the drawer is open", () => {
    mockSession = makeSession();
    mockStatus = "authenticated";
    mockPathname = "/news";
    mockIsNavOpen = true;
    const { container } = render(<Header />);
    expect(container.querySelector('[aria-label="Close menu"]')).toBeInTheDocument();
  });

  // hideLogo is threaded in from the root layout, server-side, based on
  // whether the request came from the wrapped iOS app (see
  // isNativeAppRequest.js) — inside that app the logo is redundant chrome,
  // since the visitor already knows what app they opened.
  describe("hideLogo", () => {
    it("hides the logo while the session is loading", () => {
      mockStatus = "loading";
      render(<Header hideLogo />);
      expect(screen.queryByAltText("MochaReads logo")).not.toBeInTheDocument();
    });

    it("hides the logo when logged in", () => {
      mockSession = makeSession();
      mockStatus = "authenticated";
      render(<Header hideLogo />);
      expect(screen.queryByAltText("MochaReads logo")).not.toBeInTheDocument();
      // The rest of the header is unaffected.
      expect(screen.getByRole("combobox", { name: /search articles/i })).toBeInTheDocument();
    });

    it("hides the logo when logged out", () => {
      mockStatus = "unauthenticated";
      render(<Header hideLogo />);
      expect(screen.queryByAltText("MochaReads logo")).not.toBeInTheDocument();
      // The log-in button is unaffected.
      expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    });

    it("still shows the logo by default", () => {
      mockStatus = "unauthenticated";
      render(<Header />);
      expect(screen.getByAltText("MochaReads logo")).toBeInTheDocument();
    });
  });
});
