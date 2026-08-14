import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

vi.mock("@/components/AuthLayout", () => ({
  default: ({ tabs, children }) => (
    <div data-testid="auth-layout">
      {tabs}
      {children}
    </div>
  ),
}));
vi.mock("@/components/AuthTabs", () => ({
  default: () => <div data-testid="auth-tabs" />,
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const mockRedirect = vi.fn((url) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url) => mockRedirect(url) }));

const { default: AuthGroupLayout } = await import("./layout");

describe("(auth) route group layout", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("redirects already-authenticated visitors to /news", async () => {
    mockAuth.mockResolvedValue(makeSession());

    await expect(AuthGroupLayout({ children: <div /> })).rejects.toThrow("REDIRECT:/news");
  });

  it("renders the shared AuthLayout with tabs and children for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);

    const element = await AuthGroupLayout({ children: <div data-testid="page-content" /> });
    render(element);

    expect(screen.getByTestId("auth-layout")).toBeInTheDocument();
    expect(screen.getByTestId("auth-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });
});
