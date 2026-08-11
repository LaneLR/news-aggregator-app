import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AboutPageComponent from "./AboutPage";

describe("AboutPage", () => {
  it("renders every FAQ item collapsed by default", () => {
    render(<AboutPageComponent />);
    expect(screen.getByText("What is MochaReads?")).toBeInTheDocument();
    expect(screen.getByText("Is MochaReads free to use?")).toBeInTheDocument();
  });

  it("filters FAQ items by the search query", async () => {
    const user = userEvent.setup();
    render(<AboutPageComponent />);
    await user.type(
      screen.getByLabelText("Search frequently asked questions"),
      "referral"
    );

    expect(screen.getByText("How do referral codes work?")).toBeInTheDocument();
    expect(screen.queryByText("What is MochaReads?")).not.toBeInTheDocument();
  });

  it("shows a no-results message when nothing matches", async () => {
    const user = userEvent.setup();
    render(<AboutPageComponent />);
    await user.type(
      screen.getByLabelText("Search frequently asked questions"),
      "zzzzznomatch"
    );

    expect(screen.getByText(/No matches for/)).toBeInTheDocument();
  });

  it("expands an accordion item to reveal its answer", async () => {
    const user = userEvent.setup();
    render(<AboutPageComponent />);
    await user.click(screen.getByRole("button", { name: /What is MochaReads\?/ }));
    expect(screen.getByText(/RSS-powered news aggregator/)).toBeInTheDocument();
  });
});
