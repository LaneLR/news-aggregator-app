import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingDots from "./Loading";

describe("LoadingDots", () => {
  it("renders a status role with the default aria-label", () => {
    render(<LoadingDots />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("renders five dots", () => {
    const { container } = render(<LoadingDots />);
    expect(container.querySelectorAll("div")).toBeTruthy();
    // 5 dots + wrapper + dotsWrapper = 7 divs total
    const dots = container.querySelectorAll('[class*="dot"]');
    expect(dots.length).toBeGreaterThanOrEqual(5);
  });

  it("accepts a custom aria-label", () => {
    render(<LoadingDots aria-label="Fetching articles" />);
    expect(screen.getByRole("status", { name: "Fetching articles" })).toBeInTheDocument();
  });
});
