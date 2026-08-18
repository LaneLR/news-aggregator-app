import { describe, expect, it, vi } from "vitest";
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
vi.mock("@/components/Header", () => ({ default: () => <div data-testid="header" /> }));
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

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { default: RootLayout, metadata, viewport } = await import("./layout");

describe("RootLayout", () => {
  it("renders children inside the full provider/chrome stack and passes the session through", async () => {
    const session = makeSession({ selectedTheme: null });
    mockAuth.mockResolvedValue(session);

    const element = await RootLayout({ children: <div data-testid="page-content">hi</div> });
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

  it("exports a theme-color viewport", () => {
    expect(viewport.themeColor).toBe("#6f4225");
  });
});
