import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockPathname = "/news";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const { default: MobileNavProvider, useMobileNav } = await import("./MobileNavProvider");

function Consumer() {
  const { isOpen, open, close, toggle } = useMobileNav();
  return (
    <div>
      <span data-testid="state">{isOpen ? "open" : "closed"}</span>
      <button type="button" onClick={open}>
        open
      </button>
      <button type="button" onClick={close}>
        close
      </button>
      <button type="button" onClick={toggle}>
        toggle
      </button>
    </div>
  );
}

describe("MobileNavProvider", () => {
  beforeEach(() => {
    mockPathname = "/news";
    document.body.style.overflow = "";
  });

  it("useMobileNav outside a provider returns a closed, no-op-safe default", async () => {
    const user = userEvent.setup();
    render(<Consumer />);
    expect(screen.getByTestId("state")).toHaveTextContent("closed");

    // Calling the unwrapped default's open/close/toggle should be inert
    // (no provider state to update, no error thrown) rather than crash a
    // component that renders before/without a MobileNavProvider ancestor.
    await user.click(screen.getByRole("button", { name: "open" }));
    await user.click(screen.getByRole("button", { name: "close" }));
    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });

  it("starts closed and opens/closes/toggles via the exposed actions", async () => {
    const user = userEvent.setup();
    render(
      <MobileNavProvider>
        <Consumer />
      </MobileNavProvider>
    );

    expect(screen.getByTestId("state")).toHaveTextContent("closed");

    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");

    await user.click(screen.getByRole("button", { name: "close" }));
    expect(screen.getByTestId("state")).toHaveTextContent("closed");

    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");
    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });

  it("locks background scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    render(
      <MobileNavProvider>
        <Consumer />
      </MobileNavProvider>
    );

    expect(document.body.style.overflow).toBe("");
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "close" }));
    expect(document.body.style.overflow).toBe("");
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(
      <MobileNavProvider>
        <Consumer />
      </MobileNavProvider>
    );

    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });

  it("does not react to non-Escape keys while open", async () => {
    const user = userEvent.setup();
    render(
      <MobileNavProvider>
        <Consumer />
      </MobileNavProvider>
    );

    await user.click(screen.getByRole("button", { name: "open" }));
    fireEvent.keyDown(document, { key: "a" });
    expect(screen.getByTestId("state")).toHaveTextContent("open");
  });

  it("closes automatically when the route changes (a nav link was followed)", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MobileNavProvider>
        <Consumer />
      </MobileNavProvider>
    );

    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");

    mockPathname = "/category/tech";
    rerender(
      <MobileNavProvider>
        <Consumer />
      </MobileNavProvider>
    );

    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });
});
