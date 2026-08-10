import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const sessionProviderProps = vi.fn();
vi.mock("next-auth/react", () => ({
  SessionProvider: (props) => {
    sessionProviderProps(props.session);
    return <div data-testid="next-auth-session-provider">{props.children}</div>;
  },
}));

const { default: SessionProvider } = await import("./SessionProvider");

describe("SessionProvider", () => {
  it("renders its children through next-auth's SessionProvider", () => {
    render(
      <SessionProvider session={null}>
        <p>child content</p>
      </SessionProvider>
    );
    expect(screen.getByTestId("next-auth-session-provider")).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("passes the session prop through unchanged", () => {
    const session = { user: { id: "user-1" }, expires: "2099-01-01" };
    render(
      <SessionProvider session={session}>
        <p>child</p>
      </SessionProvider>
    );
    expect(sessionProviderProps).toHaveBeenCalledWith(session);
  });
});
