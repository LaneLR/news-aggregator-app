import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

const { default: AccountShellLayout } = await import("./AccountShellLayout");

describe("AccountShellLayout", () => {
  it("renders its children", async () => {
    render(
      <AccountShellLayout>
        <p>Account content</p>
      </AccountShellLayout>
    );
    expect(await screen.findByText("Account content")).toBeInTheDocument();
  });
});
