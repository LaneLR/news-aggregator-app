import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/ResetPasswordForm", () => ({
  default: () => <div data-testid="reset-password-form" />,
}));

const { default: PasswordResetPage, metadata } = await import("./page");

describe("PasswordResetPage", () => {
  it("renders the reset password form", () => {
    render(<PasswordResetPage />);

    expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
