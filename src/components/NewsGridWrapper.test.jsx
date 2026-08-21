import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NewsGridWrapper from "./NewsGridWrapper";

describe("NewsGridWrapper", () => {
  it("renders children", () => {
    render(
      <NewsGridWrapper>
        <span>Card one</span>
      </NewsGridWrapper>
    );
    expect(screen.getByText("Card one")).toBeInTheDocument();
  });

  it("applies no extra density class by default (card density)", () => {
    const { container } = render(<NewsGridWrapper>content</NewsGridWrapper>);
    // Default density has just the base wrapper class, no listWrapper suffix.
    expect(container.firstChild.className).not.toMatch(/list/i);
  });

  it("applies a density-specific class for 'list' density", () => {
    const { container } = render(<NewsGridWrapper density="list">content</NewsGridWrapper>);
    expect(container.firstChild.className.toLowerCase()).toContain("list");
  });
});
