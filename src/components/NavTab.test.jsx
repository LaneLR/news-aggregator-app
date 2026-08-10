import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockPathname = "/news";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const { default: NavTab } = await import("./NavTab");

describe("NavTab", () => {
  it("renders a link with the given href and label", () => {
    mockPathname = "/other";
    render(<NavTab href="/news">News</NavTab>);
    const link = screen.getByRole("link", { name: "News" });
    expect(link).toHaveAttribute("href", "/news");
  });

  it("marks itself active when the current path matches href", () => {
    mockPathname = "/news";
    render(<NavTab href="/news">News</NavTab>);
    expect(screen.getByRole("link", { name: "News" }).className).toMatch(/active/);
  });

  it("does not mark itself active when the current path doesn't match", () => {
    mockPathname = "/archives";
    render(<NavTab href="/news">News</NavTab>);
    expect(screen.getByRole("link", { name: "News" }).className).not.toMatch(/active/);
  });

  it("renders an optional icon", () => {
    mockPathname = "/news";
    const Icon = (props) => <svg data-testid="icon" {...props} />;
    render(
      <NavTab href="/news" Icon={Icon}>
        News
      </NavTab>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
