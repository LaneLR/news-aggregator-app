import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialogProvider, { useConfirm } from "./ConfirmDialogProvider";

function Trigger({ onResult, options }) {
  const confirm = useConfirm();
  const handleClick = async () => {
    const result = await confirm(options);
    onResult(result);
  };
  return (
    <button type="button" onClick={handleClick}>
      Ask
    </button>
  );
}

describe("ConfirmDialogProvider", () => {
  it("resolves true when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    const results = [];
    render(
      <ConfirmDialogProvider>
        <Trigger onResult={(r) => results.push(r)} options={{ title: "Delete this?", confirmLabel: "Delete" }} />
      </ConfirmDialogProvider>
    );

    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Delete this?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(results).toEqual([true]);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("resolves false when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const results = [];
    render(
      <ConfirmDialogProvider>
        <Trigger onResult={(r) => results.push(r)} options={{}} />
      </ConfirmDialogProvider>
    );

    await user.click(screen.getByRole("button", { name: "Ask" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(results).toEqual([false]);
  });

  it("resolves false on Escape", async () => {
    const user = userEvent.setup();
    const results = [];
    render(
      <ConfirmDialogProvider>
        <Trigger onResult={(r) => results.push(r)} options={{}} />
      </ConfirmDialogProvider>
    );

    await user.click(screen.getByRole("button", { name: "Ask" }));
    await user.keyboard("{Escape}");
    expect(results).toEqual([false]);
  });

  it("uses default labels when none are provided", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialogProvider>
        <Trigger onResult={() => {}} options={{}} />
      </ConfirmDialogProvider>
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });
});
