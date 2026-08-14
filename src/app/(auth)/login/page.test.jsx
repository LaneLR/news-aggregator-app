import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/LoginForm", () => ({
  default: () => <div data-testid="login-form" />,
}));
vi.mock("../../loading", () => ({
  default: () => <div data-testid="page-loading" />,
}));

const { default: Login, metadata } = await import("./page");

describe("Login page", () => {
  it("renders the login form", () => {
    render(<Login />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Log In");
  });
});
