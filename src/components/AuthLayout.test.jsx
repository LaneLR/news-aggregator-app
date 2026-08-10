import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthLayout from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders the brand highlights and children", () => {
    render(
      <AuthLayout activeTab="signin">
        <p>Login form</p>
      </AuthLayout>
    );
    expect(screen.getByText("Curated headlines")).toBeInTheDocument();
    expect(screen.getByText("Markets & business")).toBeInTheDocument();
    expect(screen.getByText("Save for later")).toBeInTheDocument();
    expect(screen.getByText("Login form")).toBeInTheDocument();
  });

  it("shows the sign in / register tabs with the active one marked when activeTab is signin or register", () => {
    render(<AuthLayout activeTab="signin">{null}</AuthLayout>);
    const signInTab = screen.getByRole("link", { name: "Sign In" });
    const registerTab = screen.getByRole("link", { name: "Create Account" });
    expect(signInTab).toHaveAttribute("href", "/login");
    expect(registerTab).toHaveAttribute("href", "/register");
  });

  it("hides the tab row for other activeTab values (e.g. forgot-password)", () => {
    render(<AuthLayout activeTab="forgot-password">{null}</AuthLayout>);
    expect(screen.queryByRole("link", { name: "Sign In" })).not.toBeInTheDocument();
  });
});
