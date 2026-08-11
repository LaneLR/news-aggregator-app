import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/LegalInfoPage", () => ({
  default: (props) => <div data-testid="legal-info-page">{JSON.stringify(props)}</div>,
}));

const { default: AboutPage, metadata } = await import("./page");

describe("AboutPage", () => {
  it("renders LegalInfoPage with the 'about' tab and the contact email", () => {
    render(<AboutPage />);

    const props = JSON.parse(screen.getByTestId("legal-info-page").textContent);
    expect(props.activeTab).toBe("about");
    expect(props.contactEmail).toBe(process.env.CONTACT_EMAIL);
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("About");
    expect(metadata.description).toMatch(/MochaReads/);
  });
});
