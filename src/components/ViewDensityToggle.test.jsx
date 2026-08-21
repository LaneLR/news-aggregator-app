import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { default: ViewDensityToggle } = await import("./ViewDensityToggle");

describe("ViewDensityToggle", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("renders a button per density option", () => {
    render(<ViewDensityToggle density="card" onChange={vi.fn()} isSubscribed={false} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("marks the active density with aria-pressed", () => {
    render(<ViewDensityToggle density="card" onChange={vi.fn()} isSubscribed={false} />);
    expect(screen.getByRole("button", { name: "Card view" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Reader (3-pane) view" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange when clicking an unlocked option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewDensityToggle density="card" onChange={onChange} isSubscribed={false} />);

    await user.click(screen.getByRole("button", { name: "Reader (3-pane) view" }));

    expect(onChange).toHaveBeenCalledWith("reader");
    expect(push).not.toHaveBeenCalled();
  });

  it("routes to /pricing instead of calling onChange for a subscriber-only option when not subscribed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewDensityToggle density="card" onChange={onChange} isSubscribed={false} />);

    await user.click(screen.getByRole("button", { name: "List view — Subscribed feature" }));

    expect(push).toHaveBeenCalledWith("/pricing");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange for a subscriber-only option when subscribed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ViewDensityToggle density="card" onChange={onChange} isSubscribed={true} />);

    await user.click(screen.getByRole("button", { name: "List view" }));

    expect(onChange).toHaveBeenCalledWith("list");
    expect(push).not.toHaveBeenCalled();
  });
});
