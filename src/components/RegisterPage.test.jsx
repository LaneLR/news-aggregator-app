import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { default: RegisterPage } = await import("./RegisterPage");

async function fillForm(user, { email = "test@example.com", password = "password1", confirmPassword = "password1" } = {}) {
  await user.type(screen.getByPlaceholderText("you@example.com"), email);
  await user.type(screen.getByPlaceholderText("Create a password"), password);
  await user.type(screen.getByPlaceholderText("Re-enter your password"), confirmPassword);
  await user.click(screen.getByRole("checkbox"));
}

describe("RegisterPage", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("renders the registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "Create Account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    const passwordInput = screen.getByPlaceholderText("Create a password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getAllByRole("button", { name: "Show password" })[0]);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("shows an error and does not submit when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillForm(user, { confirmPassword: "different" });
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits and redirects to email verification on success", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ success: true }));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", password: "password1" }),
      })
    );
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/verification/verify-email"));
  });

  it("shows a server-provided error message when registration fails", async () => {
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ error: "Email already in use" }, { ok: false, status: 409 }));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Email already in use")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a generic error message when the request itself throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error("network down"));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });
});
