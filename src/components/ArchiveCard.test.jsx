import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ArchiveCard from "./ArchiveCard";

describe("ArchiveCard", () => {
  const baseArchive = {
    id: "archive-1",
    name: "Reading list",
    articleCount: 5,
    lastUpdated: "2 days ago",
    articleImages: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  };

  it("renders the archive name, meta text, and a link to its detail page", () => {
    render(<ArchiveCard archive={baseArchive} />);
    expect(screen.getByText("Reading list")).toBeInTheDocument();
    expect(screen.getByText(/5 Articles/)).toBeInTheDocument();
    expect(screen.getByText(/2 days ago/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/archives/archive-1");
  });

  it("fills remaining image slots with empty placeholders when fewer than 4 images exist", () => {
    const { container } = render(<ArchiveCard archive={baseArchive} />);
    // 2 real images (rendered as background-image divs) + 2 empty slots = 4 total.
    const grid = container.querySelector('[class*="imageGrid"]');
    expect(grid.children).toHaveLength(4);
  });

  it("renders children as card controls when provided", () => {
    render(
      <ArchiveCard archive={baseArchive}>
        <button type="button">Delete</button>
      </ArchiveCard>
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("omits the controls wrapper when no children are passed", () => {
    const { container } = render(<ArchiveCard archive={baseArchive} />);
    expect(container.querySelector('[class*="cardControls"]')).not.toBeInTheDocument();
  });
});
