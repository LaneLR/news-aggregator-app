import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/LegalInfoPage", () => ({
  default: (props) => <div data-testid="legal-info-page">{JSON.stringify(props)}</div>,
}));

const { default: PrivacyPage, metadata } = await import("./page");

describe("PrivacyPage", () => {
  it("renders LegalInfoPage with the 'privacy' tab and the contact email", () => {
    render(<PrivacyPage />);

    const props = JSON.parse(screen.getByTestId("legal-info-page").textContent);
    expect(props.activeTab).toBe("privacy");
    expect(props.contactEmail).toBe(process.env.CONTACT_EMAIL);
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Privacy Policy");
  });
});
