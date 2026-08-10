import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const update = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ update }),
}));

const { default: ResumeSubscriptionButton } = await import("./ResumeSubscriptionButton");

describe("ResumeSubscriptionButton", () => {
  it("shows the cancellation date when subscriptionEndDate is provided", () => {
    const isoDate = "2026-03-15T00:00:00.000Z";
    const expectedDate = new Date(isoDate).toLocaleDateString();
    const { container } = render(<ResumeSubscriptionButton subscriptionEndDate={isoDate} />);
    expect(container.querySelector("p").textContent).toContain(`on ${expectedDate}`);
  });

  it("omits the date clause when subscriptionEndDate is not provided", () => {
    render(<ResumeSubscriptionButton subscriptionEndDate={null} />);
    expect(screen.getByText(/^Your subscription is set to cancel\s*\. You can resume/)).toBeInTheDocument();
  });

  it("resumes the subscription and refreshes the session on success", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
    const user = userEvent.setup();

    render(<ResumeSubscriptionButton subscriptionEndDate={null} />);
    await user.click(screen.getByRole("button", { name: "Resume Subscription" }));

    expect(global.fetch).toHaveBeenCalledWith("/api/stripe/resume-subscription", { method: "POST" });
    await vi.waitFor(() => expect(update).toHaveBeenCalled());
    expect(screen.queryByText(/Failed/)).not.toBeInTheDocument();
  });

  it("shows an error message when the resume request fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ error: "Could not resume." }, { ok: false, status: 400 }));
    const user = userEvent.setup();

    render(<ResumeSubscriptionButton subscriptionEndDate={null} />);
    await user.click(screen.getByRole("button", { name: "Resume Subscription" }));

    expect(await screen.findByText("Could not resume.")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });
});
