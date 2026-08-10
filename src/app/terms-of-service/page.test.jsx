import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/LegalInfoPage", () => ({
  default: (props) => <div data-testid="legal-info-page">{JSON.stringify(props)}</div>,
}));

const { default: TermsOfServicePage, metadata } = await import("./page");

describe("TermsOfServicePage", () => {
  it("renders LegalInfoPage with the 'terms' tab and the contact email", () => {
    render(<TermsOfServicePage />);

    const props = JSON.parse(screen.getByTestId("legal-info-page").textContent);
    expect(props.activeTab).toBe("terms");
    expect(props.contactEmail).toBe(process.env.CONTACT_EMAIL);
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Terms of Service");
  });
});
