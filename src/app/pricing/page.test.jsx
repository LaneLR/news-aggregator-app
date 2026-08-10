import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/PricingPage", () => ({
  default: () => <div data-testid="pricing-page" />,
}));

const { default: PricingPage, metadata } = await import("./page");

describe("PricingPage", () => {
  it("renders the PricingPage component", () => {
    render(<PricingPage />);

    expect(screen.getByTestId("pricing-page")).toBeInTheDocument();
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Pricing");
    expect(metadata.description).toMatch(/Free and Subscribed/);
  });
});
