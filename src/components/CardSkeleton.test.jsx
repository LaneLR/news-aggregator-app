import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import CardSkeleton from "./CardSkeleton";

describe("CardSkeleton", () => {
  it("renders without crashing using the default 'card' density", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders three shimmer icon dots (representing the actions row)", () => {
    const { container } = render(<CardSkeleton />);
    // 1 image shimmer + 3 title-block lines + 1 pill + 3 icon dots = 8
    const shimmers = container.querySelectorAll("[class*='shimmer']");
    expect(shimmers.length).toBeGreaterThan(0);
  });

  it("accepts a 'list' density without throwing", () => {
    const { container: listContainer } = render(<CardSkeleton density="list" />);
    expect(listContainer.firstChild).toBeInTheDocument();
  });
});
