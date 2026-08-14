import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("defaults to type='button' so it never accidentally submits a form", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("respects an explicit type prop", () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Go</Button>);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Go
      </Button>
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies bgColor/clr/wide as inline styles", () => {
    render(
      <Button bgColor="rgb(1, 2, 3)" clr="rgb(4, 5, 6)" wide="100%">
        Styled
      </Button>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveStyle({ backgroundColor: "rgb(1, 2, 3)", color: "rgb(4, 5, 6)", width: "100%" });
  });

  it("merges an optional className onto the button's own wrapper class", () => {
    render(<Button className="extraClass">Go</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("extraClass");
    // The button's own base styling class should still be present, not replaced.
    expect(button.className.split(" ").length).toBeGreaterThan(1);
  });
});
