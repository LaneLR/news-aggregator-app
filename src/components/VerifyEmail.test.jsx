import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

let mockSession = null;
let mockStatus = "unauthenticated";
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus }),
}));

const { default: VerifyEmail } = await import("./VerifyEmail");

describe("VerifyEmail", () => {
  it("shows a loading state while the session is loading", () => {
    mockSession = null;
    mockStatus = "loading";
    const { container } = render(<VerifyEmail />);
    expect(screen.queryByText("Check Your Email")).not.toBeInTheDocument();
    expect(container).not.toBeEmptyDOMElement();
  });

  it("shows the 'check your email' instructions for an unverified session", () => {
    mockSession = makeSession({ emailIsVerified: false });
    mockStatus = "authenticated";
    render(<VerifyEmail />);

    expect(screen.getByRole("heading", { name: "Check Your Email" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Sign In/ })).toHaveAttribute("href", "/login");
  });

  it("redirects to /account once the session reports the email as verified", () => {
    const replace = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, replace },
      writable: true,
    });
    mockSession = makeSession({ emailIsVerified: true });
    mockStatus = "authenticated";

    render(<VerifyEmail />);

    expect(replace).toHaveBeenCalledWith("/account");
  });
});
