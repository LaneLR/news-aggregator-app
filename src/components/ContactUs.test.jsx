import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ContactUsComponent from "./ContactUs";

describe("ContactUs", () => {
  it("renders a mailto link built from the contactEmail prop", () => {
    render(<ContactUsComponent contactEmail="help@example.com" />);
    const link = screen.getByRole("link", { name: "help@example.com" });
    expect(link).toHaveAttribute("href", "mailto:help@example.com");
  });
});
