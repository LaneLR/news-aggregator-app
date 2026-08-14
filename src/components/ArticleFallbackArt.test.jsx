import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ArticleFallbackArt from "./ArticleFallbackArt";

describe("ArticleFallbackArt", () => {
  it("renders a gradient background using the category's color", () => {
    const { container } = render(<ArticleFallbackArt category="Tech" />);
    const art = container.firstChild;
    expect(art.style.background).toContain("linear-gradient");
    expect(art.style.background).toContain("rgb(46, 92, 230)"); // #2e5ce6
  });

  it("falls back to the default color for an unknown or missing category", () => {
    const { container } = render(<ArticleFallbackArt category={null} />);
    expect(container.firstChild.style.background).toContain("rgb(51, 65, 85)"); // #334155
  });

  it("accepts a category array and uses the first entry", () => {
    const { container } = render(<ArticleFallbackArt category={["Sports", "US"]} />);
    expect(container.firstChild.style.background).toContain("rgb(194, 65, 12)"); // #c2410c
  });

  it("renders no title overlay when no title is given", () => {
    render(<ArticleFallbackArt category="Tech" />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders the title as an overlay when given one", () => {
    render(<ArticleFallbackArt category="Tech" title="A headline with no photo" />);
    expect(screen.getByRole("heading", { name: "A headline with no photo" })).toBeInTheDocument();
  });
});
