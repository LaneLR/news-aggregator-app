import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import MainContentWrapper from "./MainContentWrapper";

describe("MainContentWrapper", () => {
  it("renders children inside a <main id='main-content'>", () => {
    render(
      <MainContentWrapper>
        <p>Page content</p>
      </MainContentWrapper>
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
