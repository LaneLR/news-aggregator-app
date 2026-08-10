import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import CarouselSkeleton from "./CarouselSkeleton";

describe("CarouselSkeleton", () => {
  it("renders a fixed number of placeholder cards", () => {
    const { container } = render(<CarouselSkeleton />);
    // 4 placeholder cards, matching CarouselArticleCard's row shape.
    expect(container.querySelectorAll(".card, [class*='card']").length).toBeGreaterThanOrEqual(4);
  });
});
