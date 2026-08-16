import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GoogleSignInButton from "./GoogleSignInButton";

describe("GoogleSignInButton", () => {
  it("renders the 'Sign in with Google' button", () => {
    render(<GoogleSignInButton />);
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<GoogleSignInButton onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /sign in with google/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<GoogleSignInButton onClick={onClick} disabled />);

    const button = screen.getByRole("button", { name: /sign in with google/i });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies hover styles on mouse enter", async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton />);
    const button = screen.getByRole("button", { name: /sign in with google/i });

    await user.hover(button);

    expect(button).toHaveStyle({ boxShadow: "0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15)" });
  });

  it("removes hover styles on mouse leave", async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton />);
    const button = screen.getByRole("button", { name: /sign in with google/i });

    await user.hover(button);
    await user.unhover(button);

    expect(button).not.toHaveStyle({
      boxShadow: "0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15)",
    });
  });

  it("adjusts the state overlay opacity on focus and blur", async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton />);
    const button = screen.getByRole("button", { name: /sign in with google/i });

    await user.tab();
    expect(button).toHaveFocus();

    await user.tab();
    expect(button).not.toHaveFocus();
  });
});
