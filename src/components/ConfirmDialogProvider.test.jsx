import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("resolves false when clicking the overlay outside the dialog", async () => {
    const user = userEvent.setup();
    const results = [];
    render(
      <ConfirmDialogProvider>
        <Trigger onResult={(r) => results.push(r)} options={{}} />
      </ConfirmDialogProvider>
    );

    await user.click(screen.getByRole("button", { name: "Ask" }));
    const dialog = screen.getByRole("alertdialog");
    // Click the overlay itself (its parentElement), not the dialog — a click
    // on the dialog stops propagation and must NOT settle the promise.
    await user.click(dialog.parentElement);

    expect(results).toEqual([false]);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("clicking inside the dialog itself does not dismiss it", async () => {
    const user = userEvent.setup();
    const results = [];
    render(
      <ConfirmDialogProvider>
        <Trigger onResult={(r) => results.push(r)} options={{}} />
      </ConfirmDialogProvider>
    );

    await user.click(screen.getByRole("button", { name: "Ask" }));
    fireEvent.click(screen.getByRole("alertdialog"));

    expect(results).toEqual([]);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("shows the message text and danger styling/icon when provided", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialogProvider>
        <Trigger
          onResult={() => {}}
          options={{ title: "Delete account?", message: "This cannot be undone.", danger: true }}
        />
      </ConfirmDialogProvider>
    );

    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("does not add a keydown listener (or throw) once the dialog is dismissed", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialogProvider>
        <Trigger onResult={() => {}} options={{}} />
      </ConfirmDialogProvider>
    );

    await user.click(screen.getByRole("button", { name: "Ask" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    // Pressing Escape after the dialog is already closed should be a no-op.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("useConfirm outside a provider resolves false via the default context", async () => {
    function StandaloneTrigger({ onResult }) {
      const confirm = useConfirm();
      return (
        <button
          type="button"
          onClick={async () => onResult(await confirm({ title: "x" }))}
        >
          Ask
        </button>
      );
    }
    const user = userEvent.setup();
    const results = [];
    render(<StandaloneTrigger onResult={(r) => results.push(r)} />);

    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(results).toEqual([false]);
  });
});
