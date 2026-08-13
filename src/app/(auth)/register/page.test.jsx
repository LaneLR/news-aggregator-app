import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/RegisterPage", () => ({
  default: () => <div data-testid="register-page" />,
}));
vi.mock("../../loading", () => ({
  default: () => <div data-testid="page-loading" />,
}));

const { default: Register, metadata } = await import("./page");

describe("Register page", () => {
  it("renders the register form", () => {
    render(<Register />);
    expect(screen.getByTestId("register-page")).toBeInTheDocument();
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Sign Up");
  });
});
