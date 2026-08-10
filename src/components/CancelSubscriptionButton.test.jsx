import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const updateMock = vi.fn().mockResolvedValue(undefined);
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "authenticated", update: updateMock }),
}));

const { default: CancelSubscriptionButton } = await import("./CancelSubscriptionButton");

describe("CancelSubscriptionButton", () => {
  beforeEach(() => {
    updateMock.mockClear();
  });

  it("renders a cancel subscription button", () => {
    render(<CancelSubscriptionButton />);
    expect(screen.getByRole("button", { name: "Cancel Subscription" })).toBeInTheDocument();
  });

  it("calls the cancel API and refreshes the session on success", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({}));

    render(<CancelSubscriptionButton />);
    await user.click(screen.getByRole("button", { name: "Cancel Subscription" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith("/api/stripe/cancel-subscription", { method: "POST" });
  });

  it("shows the error message when cancellation fails", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ error: "No active subscription." }, { ok: false, status: 400 })
    );

    render(<CancelSubscriptionButton />);
    await user.click(screen.getByRole("button", { name: "Cancel Subscription" }));

    expect(await screen.findByText("No active subscription.")).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
