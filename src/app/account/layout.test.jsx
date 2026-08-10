import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/AccountShellLayout", () => ({
  default: ({ children }) => <div data-testid="account-shell">{children}</div>,
}));

const { default: AccountLayout } = await import("./layout");

describe("AccountLayout", () => {
  it("wraps children in AccountShellLayout", () => {
    render(
      <AccountLayout>
        <div>child content</div>
      </AccountLayout>
    );

    const shell = screen.getByTestId("account-shell");
    expect(shell).toContainElement(screen.getByText("child content"));
  });
});
