import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/AccountShellLayout", () => ({
  default: ({ children }) => <div data-testid="account-shell">{children}</div>,
}));

const { default: ArchivesAccountLayout } = await import("./layout");

describe("ArchivesAccountLayout", () => {
  it("wraps children in AccountShellLayout", () => {
    render(
      <ArchivesAccountLayout>
        <div>archives content</div>
      </ArchivesAccountLayout>
    );

    const shell = screen.getByTestId("account-shell");
    expect(shell).toContainElement(screen.getByText("archives content"));
  });
});
