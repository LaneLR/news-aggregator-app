import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const { default: HomeSectionsSettings } = await import("./HomeSectionsSettings");

function mockPatch(response) {
  global.fetch.mockImplementation((url, opts) => {
    if (url === "/api/users/home-sections" && opts?.method === "PATCH") {
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("HomeSectionsSettings", () => {
  beforeEach(() => {
    push.mockClear();
    toast.error.mockClear();
  });

  it("renders the hero and category options, checking initial sections", () => {
    render(<HomeSectionsSettings initialSections={["forYou", "Business"]} isSubscribed={false} />);

    expect(screen.getByRole("checkbox", { name: /for you \/ trending/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /top stories/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /business/i })).toBeChecked();
  });

  it("shows a lock affordance on subscriber-only categories for a free user", () => {
    render(<HomeSectionsSettings initialSections={[]} isSubscribed={false} />);
    // Not HTML-disabled — see the bug-fix comment in HomeSectionsSettings.jsx:
    // it stays enabled so a click can still redirect to pricing (tested
    // below), but the surrounding <label> carries the "locked" styling.
    const marketLabel = screen.getByRole("checkbox", { name: /market/i }).closest("label");
    expect(marketLabel.className).toMatch(/locked/);
  });

  it("redirects to pricing when a locked category is clicked", async () => {
    const user = userEvent.setup();
    render(<HomeSectionsSettings initialSections={[]} isSubscribed={false} />);

    // The checkbox itself is disabled, but the wrapping <label> still
    // receives the click and should redirect rather than toggle anything.
    await user.click(screen.getByText("Market"));

    expect(push).toHaveBeenCalledWith("/pricing");
  });

  it("toggles and persists a section for a subscribed user", async () => {
    const user = userEvent.setup();
    mockPatch(makeFetchResponse({ homeSections: ["forYou", "Market"] }));
    render(<HomeSectionsSettings initialSections={["forYou"]} isSubscribed={true} />);

    await user.click(screen.getByRole("checkbox", { name: /market/i }));

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /market/i })).toBeChecked());
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/home-sections",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("shows an error toast and reverts nothing crashes when saving fails", async () => {
    const user = userEvent.setup();
    mockPatch(makeFetchResponse(null, { ok: false, status: 500 }));
    render(<HomeSectionsSettings initialSections={["forYou"]} isSubscribed={true} />);

    await user.click(screen.getByRole("checkbox", { name: /top stories/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't save your home page sections. Please try again.")
    );
  });
});
