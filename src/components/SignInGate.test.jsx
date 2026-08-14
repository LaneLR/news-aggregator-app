import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SignInGate from "./SignInGate";

describe("SignInGate", () => {
  it("renders the message and links to sign in and create an account", () => {
    render(<SignInGate message="Sign in to see Trending articles." />);

    expect(screen.getByText("Sign in to see Trending articles.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Create Account" })).toHaveAttribute("href", "/register");
  });

  it("applies the compact class when compact is true", () => {
    const { container } = render(<SignInGate message="Sign in to load more articles." compact />);
    expect(container.querySelector('[class*="compact"]')).toBeInTheDocument();
  });
});
