import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BulkActionBar from "./BulkActionBar";

describe("BulkActionBar", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(
      <BulkActionBar count={0} onMarkRead={vi.fn()} onSave={vi.fn()} onLike={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the selected count and fires the right callback per button", async () => {
    const user = userEvent.setup();
    const onMarkRead = vi.fn();
    const onSave = vi.fn();
    const onLike = vi.fn();
    const onCancel = vi.fn();
    render(
      <BulkActionBar count={3} onMarkRead={onMarkRead} onSave={onSave} onLike={onLike} onCancel={onCancel} />
    );

    expect(screen.getByText("3 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Mark read/ }));
    expect(onMarkRead).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /Save/ }));
    expect(onSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /Like/ }));
    expect(onLike).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancel selection" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the action buttons but not cancel while busy", () => {
    render(
      <BulkActionBar count={2} onMarkRead={vi.fn()} onSave={vi.fn()} onLike={vi.fn()} onCancel={vi.fn()} busy />
    );
    expect(screen.getByRole("button", { name: /Mark read/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Save/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Like/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel selection" })).toBeEnabled();
  });
});
