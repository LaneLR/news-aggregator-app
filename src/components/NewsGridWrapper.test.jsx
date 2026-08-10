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
    // Default density has just the base wrapper class, no listWrapper/magazineWrapper suffix.
    expect(container.firstChild.className).not.toMatch(/list|magazine/i);
  });

  it("applies a density-specific class for 'list' density", () => {
    const { container } = render(<NewsGridWrapper density="list">content</NewsGridWrapper>);
    expect(container.firstChild.className.toLowerCase()).toContain("list");
  });

  it("applies a density-specific class for 'magazine' density", () => {
    const { container } = render(<NewsGridWrapper density="magazine">content</NewsGridWrapper>);
    expect(container.firstChild.className.toLowerCase()).toContain("magazine");
  });
});
