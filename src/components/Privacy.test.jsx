import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Privacy from "./Privacy";

describe("Privacy", () => {
  it("renders the privacy policy heading", () => {
    render(<Privacy contactEmail="help@example.com" />);
    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument();
  });

  it("renders a mailto link built from the contactEmail prop", () => {
    render(<Privacy contactEmail="help@example.com" />);
    const link = screen.getByRole("link", { name: "help@example.com" });
    expect(link).toHaveAttribute("href", "mailto:help@example.com");
  });
});
