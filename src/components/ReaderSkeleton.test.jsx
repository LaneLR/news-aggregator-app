import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import ReaderSkeleton from "./ReaderSkeleton";

describe("ReaderSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<ReaderSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders 4 action pills and 6 paragraph lines", () => {
    const { container } = render(<ReaderSkeleton />);
    // actionsRow has 4 children, paragraphs has 6 — sanity check counts via
    // the shimmer class since module-scss class names are hashed.
    const shimmers = container.querySelectorAll("[class*='shimmer']");
    // badge + titleLine + titleLineShort + 3 metaPills + hero + 4 actionPills + 6 textLines = 17
    expect(shimmers.length).toBe(17);
  });
});
