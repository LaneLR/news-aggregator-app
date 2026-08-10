import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn(), dismiss: vi.fn() };
vi.mock("./ToastProvider", () => ({ useToast: () => toast }));

const { default: ManageSubscriptionButton } = await import("./ManageSubscriptionButton");

describe("ManageSubscriptionButton", () => {
  beforeEach(() => {
    toast.error.mockClear();
    delete window.location;
    window.location = { href: "" };
  });

  it("renders the button", () => {
    render(<ManageSubscriptionButton />);
    expect(screen.getByRole("button", { name: /manage subscription/i })).toBeInTheDocument();
  });

  it("navigates to the Stripe portal URL on success", async () => {
    const user = userEvent.setup();
    global.fetch.mockImplementation((url) => {
      if (url === "/api/stripe/manage-subscription") {
        return Promise.resolve(makeFetchResponse({ url: "https://billing.stripe.com/session/abc" }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });

    render(<ManageSubscriptionButton />);
    await user.click(screen.getByRole("button", { name: /manage subscription/i }));

    await waitFor(() => expect(window.location.href).toBe("https://billing.stripe.com/session/abc"));
  });

  it("shows an error toast when the API returns an error", async () => {
    const user = userEvent.setup();
    global.fetch.mockImplementation((url) => {
      if (url === "/api/stripe/manage-subscription") {
        return Promise.resolve(makeFetchResponse({ error: "No active subscription" }));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });

    render(<ManageSubscriptionButton />);
    await user.click(screen.getByRole("button", { name: /manage subscription/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not open the subscription management page. Please try again.")
    );
  });

  it("shows an error toast when the fetch itself fails", async () => {
    const user = userEvent.setup();
    global.fetch.mockImplementation((url) => {
      if (url === "/api/stripe/manage-subscription") {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    });

    render(<ManageSubscriptionButton />);
    await user.click(screen.getByRole("button", { name: /manage subscription/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
