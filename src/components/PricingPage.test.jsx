import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession, makeFetchResponse } from "@/test/fixtures";

let mockSession = null;
let mockStatus = "unauthenticated";
const update = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus, update }),
}));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const redirectToCheckout = vi.fn().mockResolvedValue(undefined);
const stripeInstance = { redirectToCheckout };
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() => Promise.resolve(stripeInstance)),
}));

const browserOpen = vi.fn().mockResolvedValue(undefined);
vi.mock("@capacitor/browser", () => ({ Browser: { open: browserOpen } }));

const ORIGINAL_USER_AGENT = navigator.userAgent;
function setUserAgent(value) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value });
}

const { default: PricingPage } = await import("./PricingPage");

describe("PricingPage", () => {
  beforeEach(() => {
    toast.error.mockClear();
    update.mockClear();
    redirectToCheckout.mockClear();
    browserOpen.mockClear();
    delete window.location;
    window.location = { href: "" };
  });

  afterEach(() => {
    setUserAgent(ORIGINAL_USER_AGENT);
  });

  it("renders both plan cards", () => {
    mockSession = null;
    mockStatus = "unauthenticated";
    render(<PricingPage />);

    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
  });

  it("toggles between monthly and annual pricing", async () => {
    mockSession = null;
    mockStatus = "unauthenticated";
    const user = userEvent.setup();
    render(<PricingPage />);

    expect(screen.getByText("$8.99")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Annual/ }));
    expect(screen.getByText("$79.99")).toBeInTheDocument();
  });

  it("shows the referral card only for a Free-tier user", () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    const { rerender } = render(<PricingPage />);
    expect(screen.getByText("Have a referral code?")).toBeInTheDocument();

    mockSession = makeSession({ tier: "Subscribed" });
    rerender(<PricingPage />);
    expect(screen.queryByText("Have a referral code?")).not.toBeInTheDocument();
  });

  it("applies a valid referral code", async () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ promotionCodeId: "promo_1" }));
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.type(screen.getByPlaceholderText("Enter code here"), "friend10");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/referral",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ referralCode: "FRIEND10" }) })
    );
    expect(await screen.findByText("Success! Discount has been applied.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Applied!" })).toBeDisabled();
  });

  it("shows an error message for an invalid referral code", async () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ error: "Invalid code" }, { ok: false, status: 400 }));
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.type(screen.getByPlaceholderText("Enter code here"), "bad");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(await screen.findByText("Invalid code")).toBeInTheDocument();
  });

  it("redirects to /login when subscribing while logged out", async () => {
    mockSession = null;
    mockStatus = "unauthenticated";
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(window.location.href).toBe("/login");
  });

  it("starts Stripe checkout for a logged-in Free user", async () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ sessionId: "cs_test_1" }));
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/stripe/create-checkout-session",
      expect.objectContaining({ method: "POST" })
    );
    await vi.waitFor(() => expect(redirectToCheckout).toHaveBeenCalledWith({ sessionId: "cs_test_1" }));
  });

  it("opens checkout in the system browser instead of redirectToCheckout when inside the wrapped app", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ sessionId: "cs_test_1", url: "https://checkout.stripe.com/pay/cs_test_1" })
    );
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    await vi.waitFor(() =>
      expect(browserOpen).toHaveBeenCalledWith({ url: "https://checkout.stripe.com/pay/cs_test_1" })
    );
    expect(redirectToCheckout).not.toHaveBeenCalled();
  });

  it("shows a toast error if starting checkout fails", async () => {
    mockSession = makeSession({ tier: "Free" });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ error: "Could not start checkout" }, { ok: false }));
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not start checkout"));
  });

  it("shows 'Manage Subscription' for an already-subscribed user and refreshes session after managing", async () => {
    mockSession = makeSession({ tier: "Subscribed" });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ url: "https://billing.stripe.com/session" }));
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.click(screen.getByRole("button", { name: "Manage Subscription" }));

    await vi.waitFor(() => expect(update).toHaveBeenCalled());
    expect(window.location.href).toBe("https://billing.stripe.com/session");
  });

  it("opens the billing portal in the system browser when inside the wrapped app", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MochaReads-Mobile-App");
    mockSession = makeSession({ tier: "Subscribed" });
    mockStatus = "authenticated";
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ url: "https://billing.stripe.com/session" }));
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.click(screen.getByRole("button", { name: "Manage Subscription" }));

    await vi.waitFor(() =>
      expect(browserOpen).toHaveBeenCalledWith({ url: "https://billing.stripe.com/session" })
    );
    expect(window.location.href).toBe("");
  });
});
