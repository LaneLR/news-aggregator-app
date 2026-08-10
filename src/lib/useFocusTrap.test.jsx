import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useFocusTrap } from "./useFocusTrap";

// useFocusTrap only takes a ref + boolean — exercising it needs a real
// mounted DOM with actual tabbable children, so we render a small host
// component rather than calling the hook in isolation (per the batch
// instructions for this file).
function DialogHost({ isActive, focusless = false }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, isActive);
  return (
    <div>
      <button data-testid="outside">Outside</button>
      <div ref={containerRef} tabIndex={-1} data-testid="container">
        {!focusless && (
          <>
            <button data-testid="first">First</button>
            <button data-testid="second">Second</button>
            <button data-testid="last">Last</button>
          </>
        )}
      </div>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("focuses the first focusable element inside the container when activated", () => {
    render(<DialogHost isActive={true} />);
    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });

  it("does nothing when isActive is false", () => {
    render(<DialogHost isActive={false} />);
    expect(document.activeElement).not.toBe(screen.getByTestId("first"));
  });

  it("focuses the container itself when it has no focusable children", () => {
    render(<DialogHost isActive={true} focusless={true} />);
    expect(document.activeElement).toBe(screen.getByTestId("container"));
  });

  it("wraps focus from the last element back to the first on Tab", () => {
    render(<DialogHost isActive={true} />);
    screen.getByTestId("last").focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });

  it("wraps focus from the first element back to the last on Shift+Tab", () => {
    render(<DialogHost isActive={true} />);
    screen.getByTestId("first").focus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(screen.getByTestId("last"));
  });

  it("does not move focus on Tab when not at either boundary", () => {
    render(<DialogHost isActive={true} />);
    screen.getByTestId("second").focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(screen.getByTestId("second"));
  });

  it("restores focus to the previously focused element once deactivated", () => {
    const { rerender } = render(<DialogHost isActive={false} />);
    screen.getByTestId("outside").focus();
    expect(document.activeElement).toBe(screen.getByTestId("outside"));

    rerender(<DialogHost isActive={true} />);
    expect(document.activeElement).toBe(screen.getByTestId("first"));

    rerender(<DialogHost isActive={false} />);
    expect(document.activeElement).toBe(screen.getByTestId("outside"));
  });
});
