import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ToastProvider, { useToast } from "./ToastProvider";

function TriggerButtons() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success("Saved!")}>fire-success</button>
      <button onClick={() => toast.error("Something broke")}>fire-error</button>
      <button onClick={() => toast.info("FYI", { title: "Heads up" })}>fire-info-title</button>
      <button onClick={() => toast.warning("Careful now")}>fire-warning</button>
      <button onClick={() => toast.show("No auto-dismiss", { duration: 0 })}>fire-no-duration</button>
    </div>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("useToast() outside a provider returns no-op functions rather than throwing", () => {
    function Standalone() {
      const toast = useToast();
      return <button onClick={() => toast.success("x")}>fire</button>;
    }
    expect(() => render(<Standalone />)).not.toThrow();
  });

  it("every default no-op on the context (outside a provider) is safe to call", () => {
    function Standalone() {
      const toast = useToast();
      return (
        <button
          onClick={() => {
            toast.show("x");
            toast.success("x");
            toast.error("x");
            toast.warning("x");
            toast.info("x");
            toast.dismiss(1);
          }}
        >
          fire-all
        </button>
      );
    }
    render(<Standalone />);
    expect(() => fireEvent.click(screen.getByText("fire-all"))).not.toThrow();
  });

  it("shows a toast with the correct role when success/error/info is called", () => {
    render(
      <ToastProvider>
        <TriggerButtons />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("fire-success"));
    expect(screen.getByText("Saved!")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    fireEvent.click(screen.getByText("fire-error"));
    expect(screen.getByText("Something broke")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders an optional title alongside the message", () => {
    render(
      <ToastProvider>
        <TriggerButtons />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("fire-info-title"));

    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("FYI")).toBeInTheDocument();
  });

  it("auto-dismisses a success toast after its default duration", () => {
    render(
      <ToastProvider>
        <TriggerButtons />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("fire-success"));
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    // Success duration is 4000ms, then a 200ms close animation before removal.
    act(() => {
      vi.advanceTimersByTime(4000 + 200);
    });

    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
  });

  it("does not auto-dismiss a toast shown with duration: 0", () => {
    render(
      <ToastProvider>
        <TriggerButtons />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("fire-no-duration"));
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText("No auto-dismiss")).toBeInTheDocument();
  });

  it("dismisses a toast manually via its close button", () => {
    render(
      <ToastProvider>
        <TriggerButtons />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("fire-success"));
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    act(() => {
      vi.advanceTimersByTime(200); // close animation
    });

    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
  });

  it("shows a warning toast with a status role", () => {
    render(
      <ToastProvider>
        <TriggerButtons />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("fire-warning"));
    expect(screen.getByText("Careful now")).toBeInTheDocument();
  });

  it("can show multiple toasts stacked at once", () => {
    render(
      <ToastProvider>
        <TriggerButtons />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("fire-success"));
    fireEvent.click(screen.getByText("fire-error"));

    expect(screen.getByText("Saved!")).toBeInTheDocument();
    expect(screen.getByText("Something broke")).toBeInTheDocument();
  });
});
