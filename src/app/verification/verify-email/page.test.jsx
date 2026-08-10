import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/VerifyEmail", () => ({
  default: () => <div data-testid="verify-email" />,
}));

const { default: VerifyEmailPage, metadata } = await import("./page");

describe("VerifyEmailPage", () => {
  it("renders the VerifyEmail component", () => {
    render(<VerifyEmailPage />);

    expect(screen.getByTestId("verify-email")).toBeInTheDocument();
  });

  it("marks the page as noindex", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
