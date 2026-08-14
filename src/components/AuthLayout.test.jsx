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

  it("renders the brand photo as a decorative, grayscale background with a dark scrim behind the text", () => {
    const { container } = render(<AuthLayout>{null}</AuthLayout>);

    const photo = screen.getByAltText("");
    expect(photo).toHaveAttribute("src", expect.stringContaining("phone-held-news"));
    expect(photo.className).toContain("brandPhoto");

    expect(container.querySelector('[class*="brandOverlay"]')).toBeInTheDocument();
  });

  it("renders 'Mocha' before 'Reads', matching Header.module.scss's :first-child accent / :last-child plain color split", () => {
    const { container } = render(<AuthLayout>{null}</AuthLayout>);
    const spans = container.querySelectorAll('[class*="logoText"] span');
    expect([...spans].map((s) => s.textContent)).toEqual(["Mocha", "Reads"]);
  });
});
