import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

let mockSearchParams = new URLSearchParams({ token: "reset-token-1" });
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

const { default: ResetPasswordForm } = await import("./ResetPasswordForm");

async function fillForm(user, { password = "newpassword1", confirmPassword = "newpassword1" } = {}) {
  await user.type(screen.getByLabelText("New Password"), password);
  await user.type(screen.getByLabelText("Confirm New Password"), confirmPassword);
}

describe("ResetPasswordForm", () => {
  it("renders the reset password form", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByRole("heading", { name: "Reset Your Password" })).toBeInTheDocument();
  });

  it("shows an error and blocks submission when there's no token", async () => {
    mockSearchParams = new URLSearchParams();
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByText("Missing token. Please request a new reset link.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
    mockSearchParams = new URLSearchParams({ token: "reset-token-1" });
  });

  it("shows an error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await fillForm(user, { confirmPassword: "different1" });
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("shows an error when the password is too short", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await fillForm(user, { password: "abc", confirmPassword: "abc" });
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByText("Password must be at least 6 characters long.")).toBeInTheDocument();
  });

  it("submits the token and new password, then shows the success screen", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ message: "Password updated." }));
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "reset-token-1", newPassword: "newpassword1" }),
      })
    );
    expect(await screen.findByRole("heading", { name: "Password Reset" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Sign In" })).toHaveAttribute("href", "/login");
  });

  it("shows the server error message when the reset request fails", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ error: "Token expired." }, { ok: false, status: 400 }));
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByText("Token expired.")).toBeInTheDocument();
  });
});
