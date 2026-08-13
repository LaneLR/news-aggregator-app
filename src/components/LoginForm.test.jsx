import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockSession = null;
let mockStatus = "unauthenticated";
let mockSearchParams = new URLSearchParams();
const signIn = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession, status: mockStatus }),
  signIn: (...args) => signIn(...args),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

const { default: LoginPage } = await import("./LoginForm");

describe("LoginForm", () => {
  beforeEach(() => {
    mockSession = null;
    mockStatus = "unauthenticated";
    mockSearchParams = new URLSearchParams();
    signIn.mockReset();
    delete window.location;
    window.location = { href: "" };
  });

  it("shows a loading indicator while the session is resolving", () => {
    mockStatus = "loading";
    render(<LoginPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sign In" })).not.toBeInTheDocument();
  });

  it("renders the sign-in form", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
  });

  it("shows the verified banner when ?verified=1 is present", () => {
    mockSearchParams = new URLSearchParams("verified=1");
    render(<LoginPage />);
    expect(screen.getByText(/email verified/i)).toBeInTheDocument();
  });

  it("shows an OAuth error message from the URL", () => {
    mockSearchParams = new URLSearchParams("error=AccessDenied");
    render(<LoginPage />);
    expect(screen.getByText(/google sign-in was cancelled/i)).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("navigates to /news on successful credentials login", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ error: null });
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(window.location.href).toBe("/news"));
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "hunter2",
      redirect: false,
    });
  });

  it("shows a mapped error message for a known error code", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ error: "CredentialsSignin", code: "invalid-password" });
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Incorrect password.")).toBeInTheDocument();
  });

  it("falls back to a generic error message for an unmapped error code", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ error: "CredentialsSignin", code: "some-unknown-code" });
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("you@example.com"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Enter your password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText(/something went wrong signing in/i)).toBeInTheDocument();
  });

  it("triggers Google sign-in when the Google button is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /sign in with google/i }));

    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/news" });
  });

  it("redirects to /news if landing on the login page while already authenticated", async () => {
    mockStatus = "authenticated";
    render(<LoginPage />);
    await waitFor(() => expect(window.location.href).toBe("/news"));
  });
});
