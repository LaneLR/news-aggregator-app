import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

// The root layout wires together every provider/chrome component in the
// app — this test is about the WIRING (session passed through, children
// placed correctly, data-theme reflecting the user's saved theme), not
// re-testing any individual provider's own behavior, so every child is
// mocked to a simple pass-through/testid stub.
vi.mock("@/Provider", () => ({
  default: ({ children, session }) => (
    <div data-testid="providers" data-session={session ? JSON.stringify(session) : ""}>
      {children}
    </div>
  ),
}));
vi.mock("@/components/Header", () => ({
  default: ({ hideLogo }) => <div data-testid="header" data-hide-logo={hideLogo ? "true" : "false"} />,
}));
vi.mock("@/components/AppWrapper", () => ({
  default: ({ children }) => <div data-testid="app-wrapper">{children}</div>,
}));
vi.mock("@/components/MainContentWrapper", () => ({
  default: ({ children }) => <div data-testid="main-content">{children}</div>,
}));
vi.mock("@/components/Footer", () => ({ default: () => <div data-testid="footer" /> }));
vi.mock("@/components/MobileTabBar", () => ({ default: () => <div data-testid="mobile-tab-bar" /> }));
vi.mock("@/components/ThemeProvider", () => ({
  default: ({ children }) => <div data-testid="theme-provider">{children}</div>,
}));
vi.mock("@/components/PostHogProvider", () => ({
  default: ({ children }) => <div data-testid="posthog-provider">{children}</div>,
}));
vi.mock("@/components/ServiceWorkerRegister", () => ({
  default: () => <div data-testid="sw-register" />,
}));
vi.mock("@/components/JsonLd", () => ({
  default: ({ data }) => <script type="application/ld+json" data-testid="json-ld">{JSON.stringify(data)}</script>,
}));
vi.mock("@/components/KeyboardShortcutsProvider", () => ({
  default: ({ children }) => <div data-testid="keyboard-shortcuts-provider">{children}</div>,
}));
vi.mock("@/components/CommandPalette", () => ({
  default: () => <div data-testid="command-palette" />,
}));
vi.mock("@/components/ToastProvider", () => ({
  default: ({ children }) => <div data-testid="toast-provider">{children}</div>,
}));
vi.mock("@/components/ConfirmDialogProvider", () => ({
  default: ({ children }) => <div data-testid="confirm-dialog-provider">{children}</div>,
}));
vi.mock("@/components/FollowedSourcesProvider", () => ({
  default: ({ children }) => <div data-testid="followed-sources-provider">{children}</div>,
}));
vi.mock("@/components/MobileNavProvider", () => ({
  default: ({ children }) => <div data-testid="mobile-nav-provider">{children}</div>,
}));
vi.mock("@/components/NativeSplashHandler", () => ({
  default: () => <div data-testid="native-splash-handler" />,
}));
vi.mock("@/components/AppSplashScreen", () => ({
  default: () => <div data-testid="app-splash-screen" />,
}));
vi.mock("@/components/BackToTopButton", () => ({
  default: () => <div data-testid="back-to-top-button" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockIsNativeAppRequest = vi.fn();
vi.mock("@/lib/isNativeAppRequest", () => ({
  isNativeAppRequest: () => mockIsNativeAppRequest(),
}));

const { default: RootLayout, metadata, viewport } = await import("./layout");

describe("RootLayout", () => {
  beforeEach(() => {
    mockIsNativeAppRequest.mockReset().mockResolvedValue(false);
  });

  it("renders children inside the full provider/chrome stack and passes the session through", async () => {
    const session = makeSession({ selectedTheme: null });
    mockAuth.mockResolvedValue(session);

    const element = await RootLayout({
      children: <div data-testid="page-content">hi</div>,
      modal: <div data-testid="modal-slot">modal content</div>,
    });
    // React (this DOM version) silently drops <html>/<body> wrapper tags
    // when rendered under a plain <div> (RTL's default container) instead
    // of throwing, since they're invalid nesting there — their children
    // still render, but the wrapper elements/attributes themselves can't
    // be asserted on via the rendered DOM. Check those on the raw,
    // unrendered element instead; use render() only for the descendant
    // wiring below.
    expect(element.props["data-theme"]).toBeUndefined();

    render(element);

    // Providers received the server-checked session.
    const providers = screen.getByTestId("providers");
    expect(providers.dataset.session).toBe(JSON.stringify(session));

    // Chrome renders around the page content.
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-tab-bar")).toBeInTheDocument();
    expect(screen.getByTestId("back-to-top-button")).toBeInTheDocument();
    expect(screen.getByTestId("modal-slot")).toBeInTheDocument();
    expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    expect(screen.getByTestId("sw-register")).toBeInTheDocument();
    expect(
      screen.getByTestId("main-content").contains(screen.getByTestId("page-content"))
    ).toBe(true);

    // Two JSON-LD blocks: Organization + WebSite.
    const jsonLdBlocks = screen.getAllByTestId("json-ld");
    expect(jsonLdBlocks).toHaveLength(2);
    expect(jsonLdBlocks[0].textContent).toContain('"@type":"Organization"');
    expect(jsonLdBlocks[1].textContent).toContain('"@type":"WebSite"');
  });

  it("sets data-theme from the session user's selectedTheme", async () => {
    mockAuth.mockResolvedValue(makeSession({ selectedTheme: "dark" }));

    const element = await RootLayout({ children: <div /> });

    expect(element.props["data-theme"]).toBe("dark");
  });

  it("renders without a session for anonymous visitors, always forced to light", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await RootLayout({ children: <div /> });
    // Logged-out visitors always get light, regardless of OS preference —
    // dark is an opt-in only a signed-in user can make (ThemeSelector).
    expect(element.props["data-theme"]).toBe("default");

    render(element);

    expect(screen.getByTestId("providers").dataset.session).toBe("");
  });

  it("exports metadata with the default title/description/OG/Twitter tags", () => {
    expect(metadata.title.default).toBe("MochaReads — Your News, All in One Place");
    expect(metadata.title.template).toBe("%s | MochaReads");
    expect(metadata.description).toMatch(/MochaReads/);
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph.siteName).toBe("MochaReads");
    expect(metadata.twitter.card).toBe("summary_large_image");
    expect(metadata.manifest).toBe("/manifest.json");
  });

  it("exports a theme-color viewport that also covers under device notches/insets", () => {
    expect(viewport.themeColor).toBe("#6f4225");
    expect(viewport.viewportFit).toBe("cover");
  });

  describe("inside the wrapped iOS app", () => {
    it("hides the header logo, omits the footer, and mounts the splash handler", async () => {
      mockAuth.mockResolvedValue(null);
      mockIsNativeAppRequest.mockResolvedValue(true);

      const element = await RootLayout({ children: <div /> });
      render(element);

      expect(screen.getByTestId("header")).toHaveAttribute("data-hide-logo", "true");
      expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
      expect(screen.getByTestId("native-splash-handler")).toBeInTheDocument();
      expect(screen.getByTestId("app-splash-screen")).toBeInTheDocument();
    });

    it("shows the logo, footer, and no splash handler on a normal web visit", async () => {
      mockAuth.mockResolvedValue(null);
      mockIsNativeAppRequest.mockResolvedValue(false);

      const element = await RootLayout({ children: <div /> });
      render(element);

      expect(screen.getByTestId("header")).toHaveAttribute("data-hide-logo", "false");
      expect(screen.getByTestId("footer")).toBeInTheDocument();
      expect(screen.queryByTestId("native-splash-handler")).not.toBeInTheDocument();
      expect(screen.queryByTestId("app-splash-screen")).not.toBeInTheDocument();
    });
  });
});
