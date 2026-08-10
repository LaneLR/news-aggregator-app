import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/LegalInfoPage", () => ({
  default: (props) => <div data-testid="legal-info-page">{JSON.stringify(props)}</div>,
}));

const { default: ContactUsPage, metadata } = await import("./page");

describe("ContactUsPage", () => {
  it("renders LegalInfoPage with the 'contact' tab and the contact email", () => {
    render(<ContactUsPage />);

    const props = JSON.parse(screen.getByTestId("legal-info-page").textContent);
    expect(props.activeTab).toBe("contact");
    expect(props.contactEmail).toBe(process.env.CONTACT_EMAIL);
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Contact Us");
    expect(metadata.description).toMatch(/MorningFeeds/);
  });
});
