import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccordionItem from "./AccordionItem";

describe("AccordionItem", () => {
  it("renders collapsed by default", () => {
    render(<AccordionItem question="Q1" answer="A1" />);
    expect(screen.getByRole("button", { name: /Q1/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("expands and collapses when clicked", async () => {
    const user = userEvent.setup();
    render(<AccordionItem question="Q1" answer="A1" />);
    const button = screen.getByRole("button", { name: /Q1/ });

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("A1")).toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
