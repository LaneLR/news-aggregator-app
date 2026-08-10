import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/LoginForm", () => ({
  default: () => <div data-testid="login-form" />,
}));
vi.mock("@/components/Loading", () => ({
  default: () => <div data-testid="loading-dots" />,
}));
vi.mock("../loading", () => ({
  default: () => <div data-testid="page-loading" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: Login, metadata } = await import("./page");

describe("Login page", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects already-authenticated users to /news", async () => {
    mockAuth.mockResolvedValue(makeSession());

    await expect(Login()).rejects.toThrow("REDIRECT:/news");
  });

  it("renders the login form for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await Login();
    render(element);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Log In");
  });
});
