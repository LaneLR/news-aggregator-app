import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./components/SessionProvider", () => ({
  default: ({ children, session }) => (
    <div data-testid="auth-provider" data-session={session ? JSON.stringify(session) : ""}>
      {children}
    </div>
  ),
}));

const { default: Providers } = await import("./Provider");

describe("Providers", () => {
  it("renders children inside the session-aware AuthProvider", () => {
    render(
      <Providers session={null}>
        <span>content</span>
      </Providers>
    );

    const wrapper = screen.getByTestId("auth-provider");
    expect(wrapper).toContainElement(screen.getByText("content"));
  });

  it("passes the server-checked session through to AuthProvider", () => {
    const session = { user: { id: "user-1" }, expires: "2099-01-01" };
    render(
      <Providers session={session}>
        <span>content</span>
      </Providers>
    );

    expect(screen.getByTestId("auth-provider").dataset.session).toBe(JSON.stringify(session));
  });
});
