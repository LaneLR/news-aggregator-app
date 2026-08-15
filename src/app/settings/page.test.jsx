import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

vi.mock("@/components/DigestSettings", () => ({ default: () => <div data-testid="digest-settings" /> }));
vi.mock("@/components/KeywordFilters", () => ({
  default: (props) => <div data-testid="keyword-filters">{JSON.stringify(props)}</div>,
}));
vi.mock("@/components/FollowedKeywords", () => ({
  default: (props) => <div data-testid="followed-keywords">{JSON.stringify(props)}</div>,
}));
vi.mock("@/components/FollowedSources", () => ({
  default: (props) => <div data-testid="followed-sources">{JSON.stringify(props)}</div>,
}));
vi.mock("@/components/NotificationSettings", () => ({
  default: () => <div data-testid="notification-settings" />,
}));
vi.mock("@/components/KeyboardShortcutsSettings", () => ({
  default: (props) => <div data-testid="keyboard-shortcuts-settings">{JSON.stringify(props)}</div>,
}));
vi.mock("@/components/HomeSectionsSettings", () => ({
  default: (props) => <div data-testid="home-sections-settings">{JSON.stringify(props)}</div>,
}));

const { default: SettingsPage, metadata } = await import("./page");

describe("SettingsPage", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("redirects to /login when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(SettingsPage()).rejects.toThrow("REDIRECT:/login");
    expect(db.User.findByPk).not.toHaveBeenCalled();
  });

  it("fetches muted/followed keywords, shortcuts, and home sections for the current user", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Subscribed" }));
    db.User.findByPk.mockResolvedValue({
      mutedKeywords: ["politics"],
      followedKeywords: ["ai"],
      followedSources: ["Reuters"],
      keyboardShortcuts: { next: "j" },
      homeSections: ["forYou"],
    });

    const element = await SettingsPage();
    render(element);

    expect(db.User.findByPk).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        attributes: [
          "mutedKeywords",
          "followedKeywords",
          "followedSources",
          "keyboardShortcuts",
          "homeSections",
        ],
      })
    );

    expect(JSON.parse(screen.getByTestId("keyword-filters").textContent).initialKeywords).toEqual([
      "politics",
    ]);
    expect(
      JSON.parse(screen.getByTestId("followed-keywords").textContent).initialKeywords
    ).toEqual(["ai"]);
    expect(
      JSON.parse(screen.getByTestId("followed-sources").textContent).initialSources
    ).toEqual(["Reuters"]);
    expect(
      JSON.parse(screen.getByTestId("keyboard-shortcuts-settings").textContent).initialShortcuts
    ).toEqual({ next: "j" });
    expect(
      JSON.parse(screen.getByTestId("home-sections-settings").textContent).initialSections
    ).toEqual(["forYou"]);
    expect(
      JSON.parse(screen.getByTestId("home-sections-settings").textContent).isSubscribed
    ).toBe(true);

    expect(screen.getByTestId("digest-settings")).toBeInTheDocument();
    expect(screen.getByTestId("notification-settings")).toBeInTheDocument();
  });

  it("passes isSubscribed=false for Free-tier users", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1", tier: "Free" }));
    db.User.findByPk.mockResolvedValue(null);

    const element = await SettingsPage();
    render(element);

    expect(
      JSON.parse(screen.getByTestId("home-sections-settings").textContent).isSubscribed
    ).toBe(false);
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
