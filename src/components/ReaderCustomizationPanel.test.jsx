import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReaderCustomizationPanel from "./ReaderCustomizationPanel";

const defaultPrefs = { fontSize: "medium", fontFamily: "default", lineHeight: "normal", contentWidth: "normal" };

describe("ReaderCustomizationPanel", () => {
  it("keeps the panel closed until the trigger button is clicked", () => {
    render(<ReaderCustomizationPanel prefs={defaultPrefs} onChange={vi.fn()} onReset={vi.fn()} />);
    expect(screen.queryByText("Text size")).not.toBeInTheDocument();
  });

  it("opens the panel with all four segmented controls on trigger click", async () => {
    const user = userEvent.setup();
    render(<ReaderCustomizationPanel prefs={defaultPrefs} onChange={vi.fn()} onReset={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Reading display settings" }));

    expect(screen.getByText("Text size")).toBeInTheDocument();
    expect(screen.getByText("Font")).toBeInTheDocument();
    expect(screen.getByText("Line spacing")).toBeInTheDocument();
    expect(screen.getByText("Content width")).toBeInTheDocument();
  });

  it("calls onChange with the field that was clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReaderCustomizationPanel prefs={defaultPrefs} onChange={onChange} onReset={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Reading display settings" }));
    await user.click(screen.getByRole("button", { name: "L" }));

    expect(onChange).toHaveBeenCalledWith({ fontSize: "large" });
  });

  it("calls onChange for font family, line height, and content width controls", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ReaderCustomizationPanel prefs={defaultPrefs} onChange={onChange} onReset={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Reading display settings" }));

    await user.click(screen.getByRole("button", { name: "Serif" }));
    expect(onChange).toHaveBeenCalledWith({ fontFamily: "serif" });

    await user.click(screen.getByRole("button", { name: "Relaxed" }));
    expect(onChange).toHaveBeenCalledWith({ lineHeight: "relaxed" });

    await user.click(screen.getByRole("button", { name: "Wide" }));
    expect(onChange).toHaveBeenCalledWith({ contentWidth: "wide" });
  });

  it("calls onReset when 'Reset to default' is clicked", async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(<ReaderCustomizationPanel prefs={defaultPrefs} onChange={vi.fn()} onReset={onReset} />);

    await user.click(screen.getByRole("button", { name: "Reading display settings" }));
    await user.click(screen.getByRole("button", { name: /Reset to default/ }));

    expect(onReset).toHaveBeenCalled();
  });

  it("closes the panel when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ReaderCustomizationPanel prefs={defaultPrefs} onChange={vi.fn()} onReset={vi.fn()} />
        <button type="button">outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Reading display settings" }));
    expect(screen.getByText("Text size")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "outside" }));

    expect(screen.queryByText("Text size")).not.toBeInTheDocument();
  });

  it("marks the active option for each control based on prefs", async () => {
    const user = userEvent.setup();
    render(
      <ReaderCustomizationPanel
        prefs={{ fontSize: "large", fontFamily: "serif", lineHeight: "relaxed", contentWidth: "wide" }}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: "Reading display settings" }));

    expect(screen.getByRole("button", { name: "L" }).className).toMatch(/active/);
    expect(screen.getByRole("button", { name: "Serif" }).className).toMatch(/active/);
    expect(screen.getByRole("button", { name: "Relaxed" }).className).toMatch(/active/);
    expect(screen.getByRole("button", { name: "Wide" }).className).toMatch(/active/);
  });
});
