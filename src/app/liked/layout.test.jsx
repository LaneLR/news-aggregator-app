import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/AccountShellLayout", () => ({
  default: ({ children }) => <div data-testid="account-shell">{children}</div>,
}));

const { default: LikedLayout } = await import("./layout");

describe("LikedLayout", () => {
  it("wraps children in AccountShellLayout", () => {
    render(
      <LikedLayout>
        <div>liked content</div>
      </LikedLayout>
    );

    const shell = screen.getByTestId("account-shell");
    expect(shell).toContainElement(screen.getByText("liked content"));
  });
});
