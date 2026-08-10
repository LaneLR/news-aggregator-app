import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSession, makeFetchResponse } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

let mockSession = null;
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));

const { default: OnboardingFlow } = await import("./OnboardingFlow");

describe("OnboardingFlow", () => {
  beforeEach(() => {
    push.mockClear();
    mockSession = makeSession({ tier: "Free" });
  });

  it("renders step 1 with pickable categories, excluding subscriber-only ones for a Free user", () => {
    render(<OnboardingFlow />);

    expect(screen.getByRole("heading", { name: "What are you into?" })).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Business/ })).toBeInTheDocument();
    // Journals/Market are subscriberOnly and this session is Free-tier.
    expect(screen.queryByRole("button", { name: /Journals/ })).not.toBeInTheDocument();
  });

  it("includes subscriber-only categories for a Subscribed user", () => {
    mockSession = makeSession({ tier: "Subscribed" });
    render(<OnboardingFlow />);

    expect(screen.getByRole("button", { name: /Journals/ })).toBeInTheDocument();
  });

  it("'Skip for now' on step 1 saves empty preferences and redirects immediately", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/onboarding",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ preferredCategories: [], preferredSources: [] }),
      })
    );
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/news"));
  });

  it("skips straight to the tour (step 3) if Continue is clicked with no categories selected", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Read your way" })).toBeInTheDocument();
  });

  it("advances to step 2 (sources) once a category is selected, fetching sources for it", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ sources: ["TechCrunch", "The Verge"] }));
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /Business/ }));
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("/api/onboarding/sources?categories=Business");
    expect(await screen.findByRole("button", { name: "TechCrunch" })).toBeInTheDocument();
  });

  it("shows a fallback message on step 2 when no sources are found", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ sources: [] }));
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /Business/ }));
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(await screen.findByText(/No sources found for those topics yet/)).toBeInTheDocument();
  });

  it("recovers gracefully (empty source list) if the sources fetch fails", async () => {
    global.fetch.mockRejectedValueOnce(new Error("network down"));
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /Business/ }));
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(await screen.findByText(/No sources found for those topics yet/)).toBeInTheDocument();
  });

  it("lets a user pick sources on step 2 and continue into the tour", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ sources: ["TechCrunch"] }));
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /Business/ }));
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    await screen.findByRole("button", { name: "TechCrunch" });
    await user.click(screen.getByRole("button", { name: "TechCrunch" }));
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
  });

  it("'Skip' on step 2 moves straight into the tour without waiting on source selection", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ sources: [] }));
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /Business/ }));
    await user.click(screen.getByRole("button", { name: /Continue/ }));
    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
  });

  it("steps through the tour and 'Skip tour' saves current selections and redirects", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /Continue/ })); // -> tour step 3
    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();

    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
    await user.click(screen.getByRole("button", { name: "Skip tour" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/users/onboarding",
      expect.objectContaining({ method: "PATCH" })
    );
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/news"));
  });

  it("walks through every tour step to the final 'Start reading' screen and finishes onboarding", async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow />);

    await user.click(screen.getByRole("button", { name: /Continue/ })); // step 3
    await user.click(screen.getByRole("button", { name: "Continue" })); // step 4
    expect(screen.getByText("Step 4 of 5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" })); // step 5 (last)
    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "You're all set" })).toBeInTheDocument();
    // No "Skip tour" button on the last tour step.
    expect(screen.queryByRole("button", { name: "Skip tour" })).not.toBeInTheDocument();

    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
    await user.click(screen.getByRole("button", { name: /Start reading/ }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/news"));
  });
});
