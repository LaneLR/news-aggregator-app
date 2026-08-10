import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AppWrapper from "./AppWrapper";

describe("AppWrapper", () => {
  it("renders its children inside the wrapper", () => {
    render(
      <AppWrapper>
        <p>Hello</p>
      </AppWrapper>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
