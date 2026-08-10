import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/AccountShellLayout", () => ({
  default: ({ children }) => <div data-testid="account-shell">{children}</div>,
}));

const { default: FollowingLayout } = await import("./layout");

describe("FollowingLayout", () => {
  it("wraps children in AccountShellLayout", () => {
    render(
      <FollowingLayout>
        <div>following content</div>
      </FollowingLayout>
    );

    const shell = screen.getByTestId("account-shell");
    expect(shell).toContainElement(screen.getByText("following content"));
  });
});
