import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

let mockSession = null;
let mockStatus = "unauthenticated";
const update = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus, update }),
}));
vi.mock("next/navigation", () => ({
  // Header renders SearchBar under the hood, which calls usePathname() and
  // useRouter() directly.
  usePathname: () => "/news",
  useRouter: () => ({ push: vi.fn() }),
}));

const { default: Header } = await import("./Header");

describe("Header", () => {
  beforeEach(() => {
    mockSession = null;
    mockStatus = "unauthenticated";
    update.mockClear();
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
});
