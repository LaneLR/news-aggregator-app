import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockSession = null;
let mockPathname = "/news";
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));
vi.mock("@/lib/useUnreadCounts", () => ({
  useUnreadCounts: () => ({ categories: {}, feeds: 0, following: 0 }),
}));

const { default: MainContentWrapper } = await import("./MainContentWrapper");

describe("MainContentWrapper", () => {
  it("renders children inside a <main id='main-content'>", () => {
    mockPathname = "/news";
    render(
      <MainContentWrapper>
        <p>Page content</p>
      </MainContentWrapper>
    );
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("shows the persistent nav sidebar on a content page", () => {
    mockPathname = "/news";
    render(
      <MainContentWrapper>
        <p>Page content</p>
      </MainContentWrapper>
    );
    expect(screen.getByRole("navigation", { name: "Categories" })).toBeInTheDocument();
  });

  it("shows the sidebar for a signed-out visitor too, not just logged-in sessions", () => {
    mockSession = null;
    mockPathname = "/category/business";
    render(
      <MainContentWrapper>
        <p>Page content</p>
      </MainContentWrapper>
    );
    expect(screen.getByRole("navigation", { name: "Categories" })).toBeInTheDocument();
  });

  it.each([
    "/",
    "/login",
    "/register",
    "/pricing",
    "/privacy",
    "/terms-of-service",
    "/contact-us",
    "/about",
    "/forgot-password",
    "/password-reset",
    "/onboarding",
    "/subscribe",
    "/verification/verify-email",
  ])("hides the sidebar on %s", (path) => {
    mockPathname = path;
    render(
      <MainContentWrapper>
        <p>Page content</p>
      </MainContentWrapper>
    );
    expect(screen.queryByRole("navigation", { name: "Categories" })).not.toBeInTheDocument();
  });

  it.each(["/news", "/category/tech", "/search", "/archives", "/article/123", "/settings", "/account"])(
    "shows the sidebar on %s",
    (path) => {
      mockPathname = path;
      render(
        <MainContentWrapper>
          <p>Page content</p>
        </MainContentWrapper>
      );
      expect(screen.getByRole("navigation", { name: "Categories" })).toBeInTheDocument();
    }
  );
});
