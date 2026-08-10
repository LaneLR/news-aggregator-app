import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MarkAllReadButton from "./MarkAllReadButton";

describe("MarkAllReadButton", () => {
  it("renders with its label", () => {
    render(<MarkAllReadButton />);
    expect(screen.getByRole("button", { name: /mark all as read/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<MarkAllReadButton onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /mark all as read/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    render(<MarkAllReadButton disabled />);
    expect(screen.getByRole("button", { name: /mark all as read/i })).toBeDisabled();
  });
});
