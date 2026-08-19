import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

const { default: GatedCategoryTeaser } = await import("./GatedCategoryTeaser");

describe("GatedCategoryTeaser", () => {
  it("renders Market-specific copy, illustration, and a pricing CTA", () => {
    render(<GatedCategoryTeaser category="Market" />);

    expect(screen.getByText("Market coverage is for MochaReads Pro")).toBeInTheDocument();
    expect(screen.getByText(/live dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see subscription plans/i })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("renders Journal-specific copy and a pricing CTA", () => {
    render(<GatedCategoryTeaser category="Journal" />);

    expect(screen.getByText("Journals are for MochaReads Pro")).toBeInTheDocument();
    expect(screen.getByText(/peer-reviewed research/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see subscription plans/i })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("renders nothing for a category with no configured teaser content", () => {
    const { container } = render(<GatedCategoryTeaser category="Business" />);
    expect(container).toBeEmptyDOMElement();
  });
});
