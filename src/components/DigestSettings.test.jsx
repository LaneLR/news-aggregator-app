import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse, makeSession } from "@/test/fixtures";

const mockSession = { value: makeSession({ tier: "Free" }) };
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession.value, status: "authenticated" }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const { default: DigestSettings } = await import("./DigestSettings");

function mockFetchRoutes(routes) {
  global.fetch.mockImplementation((url) => {
    for (const [matcher, handler] of routes) {
      const matches = typeof matcher === "string" ? url.toString() === matcher : matcher.test(url.toString());
      if (matches) return Promise.resolve(handler());
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("DigestSettings", () => {
  beforeEach(() => {
    mockSession.value = makeSession({ tier: "Free" });
    toast.error.mockClear();
  });

  it("renders nothing until preferences have loaded", () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<DigestSettings />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the digest toggle once preferences load, off by default", async () => {
    mockFetchRoutes([["/api/users/digest-preferences", () => makeFetchResponse({ digestEnabled: false, digestFrequency: "weekly" })]]);
    render(<DigestSettings />);
    const toggle = await screen.findByLabelText("Enable email digest");
    expect(toggle).not.toBeChecked();
    expect(screen.queryByText("How often?")).not.toBeInTheDocument();
  });

  it("reveals frequency options when the digest is enabled and saves the change", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([
      ["/api/users/digest-preferences", () => makeFetchResponse({ digestEnabled: false, digestFrequency: "weekly" })],
    ]);
    render(<DigestSettings />);
    const toggle = await screen.findByLabelText("Enable email digest");

    mockFetchRoutes([
      [/\/api\/users\/digest-preferences$/, () => makeFetchResponse({ digestEnabled: true, digestFrequency: "weekly" })],
    ]);
    await user.click(toggle);

    expect(await screen.findByText("How often?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weekly" })).toHaveClass(/active/);
  });

  it("does not fetch /api/feeds for a Free-tier user", async () => {
    mockFetchRoutes([["/api/users/digest-preferences", () => makeFetchResponse({ digestEnabled: true, digestFrequency: "weekly" })]]);
    render(<DigestSettings />);
    await screen.findByText("How often?");
    expect(global.fetch).not.toHaveBeenCalledWith("/api/feeds");
  });

  it("shows a feed picker for subscribed users with saved feeds", async () => {
    mockSession.value = makeSession({ tier: "Plus" });
    mockFetchRoutes([
      ["/api/users/digest-preferences", () => makeFetchResponse({ digestEnabled: true, digestFrequency: "daily" })],
      ["/api/feeds", () => makeFetchResponse([{ id: "feed-1", title: "My Feed" }])],
    ]);
    render(<DigestSettings />);
    expect(await screen.findByText("Digest content")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "My Feed" })).toBeInTheDocument();
  });

  it("shows an error toast when saving preferences fails", async () => {
    const user = userEvent.setup();
    mockFetchRoutes([["/api/users/digest-preferences", () => makeFetchResponse({ digestEnabled: false, digestFrequency: "weekly" })]]);
    render(<DigestSettings />);
    const toggle = await screen.findByLabelText("Enable email digest");

    mockFetchRoutes([[/\/api\/users\/digest-preferences$/, () => makeFetchResponse(null, { ok: false, status: 500 })]]);
    await user.click(toggle);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong updating your email digest settings.")
    );
  });
});
