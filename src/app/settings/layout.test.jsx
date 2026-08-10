import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../loading", () => ({
  default: () => <div data-testid="page-loading" />,
}));

const { default: SettingsLayout } = await import("./layout");

describe("SettingsLayout", () => {
  it("renders children inside a main wrapper", () => {
    render(
      <SettingsLayout>
        <div>settings content</div>
      </SettingsLayout>
    );

    const content = screen.getByText("settings content");
    expect(content.closest("main")).toBeInTheDocument();
  });
});
