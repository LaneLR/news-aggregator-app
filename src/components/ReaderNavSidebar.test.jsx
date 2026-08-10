import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeSession } from "@/test/fixtures";

let mockSession = null;
let mockPathname = "/news";
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSession }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const { default: ReaderNavSidebar } = await import("./ReaderNavSidebar");

describe("ReaderNavSidebar", () => {
  it("hides subscriber-only top links and categories for a Free user", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/news";
    render(<ReaderNavSidebar />);

    expect(screen.getByRole("link", { name: /All Articles/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /For You/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /My Feeds/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Journals/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Business/ })).toBeInTheDocument();
  });

  it("shows subscriber-only top links and categories for a Subscribed user", () => {
    mockSession = makeSession({ tier: "Subscribed" });
    mockPathname = "/news";
    render(<ReaderNavSidebar />);

    expect(screen.getByRole("link", { name: /For You/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /My Feeds/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Journals/ })).toBeInTheDocument();
  });

  it("marks the link matching the current pathname as active", () => {
    mockSession = makeSession({ tier: "Free" });
    mockPathname = "/archives";
    render(<ReaderNavSidebar />);

    expect(screen.getByRole("link", { name: /Archives/ }).className).toMatch(/active/);
    expect(screen.getByRole("link", { name: /All Articles/ }).className).not.toMatch(/active/);
  });
});
