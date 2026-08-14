import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthLayout from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders the brand highlights and children", () => {
    render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );
    expect(screen.getByText("Curated headlines")).toBeInTheDocument();
    expect(screen.getByText("Markets & business")).toBeInTheDocument();
    expect(screen.getByText("Save for later")).toBeInTheDocument();
    expect(screen.getByText("Login form")).toBeInTheDocument();
  });

  it("renders whatever tabs node it's given", () => {
    render(<AuthLayout tabs={<div>My Tabs</div>}>{null}</AuthLayout>);
    expect(screen.getByText("My Tabs")).toBeInTheDocument();
  });

  it("renders nothing where the tab row would go when no tabs prop is passed", () => {
    render(<AuthLayout>{null}</AuthLayout>);
    expect(screen.queryByRole("link", { name: "Sign In" })).not.toBeInTheDocument();
  });
});
