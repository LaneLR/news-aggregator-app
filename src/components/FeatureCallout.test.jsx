import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeatureCallout from "./FeatureCallout";

const STORAGE_KEY = "morningfeeds:dismissedFeatureCallout";

describe("FeatureCallout", () => {
  it("shows the tip when it hasn't been dismissed before", async () => {
    render(<FeatureCallout />);
    expect(await screen.findByText("A couple of things worth knowing")).toBeInTheDocument();
  });

  it("does not show the tip when previously dismissed", () => {
    localStorage.setItem(STORAGE_KEY, "1");
    render(<FeatureCallout />);
    expect(screen.queryByText("A couple of things worth knowing")).not.toBeInTheDocument();
  });

  it("dismisses and persists to localStorage when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<FeatureCallout />);
    await user.click(await screen.findByRole("button", { name: "Dismiss this tip" }));
    expect(screen.queryByText("A couple of things worth knowing")).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("1");
  });
});
