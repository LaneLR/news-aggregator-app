import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const scrollState = { value: { scrollY: 0, direction: null } };
vi.mock("@/lib/useScrollDirection", () => ({
  useScrollDirection: () => scrollState.value,
}));

const { default: BackToTopButton } = await import("./BackToTopButton");

describe("BackToTopButton", () => {
  beforeEach(() => {
    scrollState.value = { scrollY: 0, direction: null };
    window.scrollTo = vi.fn();
  });

  it("is hidden from assistive tech and the tab order at rest", () => {
    render(<BackToTopButton />);
    const button = screen.getByRole("button", { hidden: true });
    expect(button).toHaveAttribute("aria-hidden", "true");
    expect(button).toHaveAttribute("tabindex", "-1");
  });

  it("stays hidden while scrolling down, even far down the page", () => {
    scrollState.value = { scrollY: 2000, direction: "down" };
    render(<BackToTopButton />);
    expect(screen.getByRole("button", { hidden: true })).toHaveAttribute("aria-hidden", "true");
  });

  it("stays hidden while scrolling up but not yet past the reveal threshold", () => {
    scrollState.value = { scrollY: 300, direction: "up" };
    render(<BackToTopButton />);
    expect(screen.getByRole("button", { hidden: true })).toHaveAttribute("aria-hidden", "true");
  });

  it("becomes visible and focusable once scrolling up past the reveal threshold", () => {
    scrollState.value = { scrollY: 800, direction: "up" };
    render(<BackToTopButton />);
    const button = screen.getByRole("button", { name: "Back to top" });
    expect(button).toHaveAttribute("aria-hidden", "false");
    expect(button).toHaveAttribute("tabindex", "0");
  });

  it("scrolls smoothly to the top when clicked", async () => {
    const user = userEvent.setup();
    scrollState.value = { scrollY: 800, direction: "up" };
    render(<BackToTopButton />);

    await user.click(screen.getByRole("button", { name: "Back to top" }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
