import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LegalInfoPage from "./LegalInfoPage";

describe("LegalInfoPage", () => {
  it("renders the About tab content and highlights its tab", () => {
    render(<LegalInfoPage activeTab="about" contactEmail="hello@morningfeeds.com" />);
    expect(screen.getByText("What is MochaReads?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About Us" }).className).toMatch(/activeTab/);
  });

  it("renders the Contact tab content with the given contact email", () => {
    render(<LegalInfoPage activeTab="contact" contactEmail="hello@morningfeeds.com" />);
    expect(screen.getByRole("heading", { name: "Contact Us" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hello@morningfeeds.com" })).toHaveAttribute(
      "href",
      "mailto:hello@morningfeeds.com"
    );
  });

  it("renders the Privacy tab content", () => {
    render(<LegalInfoPage activeTab="privacy" contactEmail="hello@morningfeeds.com" />);
    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
  });

  it("renders the Terms tab content", () => {
    render(<LegalInfoPage activeTab="terms" contactEmail="hello@morningfeeds.com" />);
    expect(screen.getByRole("heading", { name: "Terms of Service" })).toBeInTheDocument();
  });

  it("renders all four tab links regardless of the active tab", () => {
    render(<LegalInfoPage activeTab="about" contactEmail="hello@morningfeeds.com" />);
    expect(screen.getByRole("link", { name: "Contact Us" })).toHaveAttribute("href", "/contact-us");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms-of-service");
  });
});
