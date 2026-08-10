import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/ForgotPassword", () => ({
  default: () => <div data-testid="forgot-password-form" />,
}));

const { default: ForgotPasswordPage, metadata } = await import("./page");

describe("ForgotPasswordPage", () => {
  it("renders the forgot password form", () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByTestId("forgot-password-form")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
