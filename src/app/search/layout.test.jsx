import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

const { default: SearchLayout } = await import("./layout");

describe("SearchLayout", () => {
  it("renders children inside a centered main wrapper", () => {
    render(
      <SearchLayout>
        <div>search results</div>
      </SearchLayout>
    );

    const content = screen.getByText("search results");
    expect(content.closest("main")).toBeInTheDocument();
  });
});
