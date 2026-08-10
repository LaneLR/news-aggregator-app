import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TermsOfService from "./TermsOfService";

describe("TermsOfService", () => {
  it("renders the terms of service heading", () => {
    render(<TermsOfService contactEmail="legal@example.com" />);
    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
  });

  it("renders two mailto links built from the contactEmail prop", () => {
    render(<TermsOfService contactEmail="legal@example.com" />);
    const links = screen.getAllByRole("link", { name: "legal@example.com" });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute("href", "mailto:legal@example.com"));
  });
});
