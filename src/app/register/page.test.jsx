import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/RegisterPage", () => ({
  default: () => <div data-testid="register-page" />,
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

const { default: Register, metadata } = await import("./page");

describe("Register page", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects already-authenticated users to /news", async () => {
    mockAuth.mockResolvedValue(makeSession());

    await expect(Register()).rejects.toThrow("REDIRECT:/news");
  });

  it("renders the register form for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await Register();
    render(element);

    expect(screen.getByTestId("register-page")).toBeInTheDocument();
  });

  it("exports page metadata", () => {
    expect(metadata.title).toBe("Sign Up");
  });
});
