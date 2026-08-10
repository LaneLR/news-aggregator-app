import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";
import ForgotPasswordComponent from "./ForgotPassword";

function mockRequestReset(response) {
  global.fetch.mockImplementation((url, opts) => {
    if (url === "/api/auth/request-reset" && opts?.method === "POST") {
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  });
}

describe("ForgotPasswordComponent", () => {
  it("renders the request form", () => {
    render(<ForgotPasswordComponent />);
    expect(screen.getByRole("heading", { name: /forgot your password/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows the success screen after a successful request", async () => {
    const user = userEvent.setup();
    mockRequestReset(makeFetchResponse({ message: "Check your inbox for a reset link." }));
    render(<ForgotPasswordComponent />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument();
    expect(screen.getByText("Check your inbox for a reset link.")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    const user = userEvent.setup();
    mockRequestReset(makeFetchResponse({ error: "No account with that email." }, { ok: false, status: 404 }));
    render(<ForgotPasswordComponent />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "nope@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText("No account with that email.")).toBeInTheDocument();
  });

  it("disables the button and shows 'Sending...' while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveFetch;
    global.fetch.mockImplementation(() => new Promise((resolve) => (resolveFetch = resolve)));
    render(<ForgotPasswordComponent />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    resolveFetch(makeFetchResponse({ message: "Sent." }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument());
  });
});
