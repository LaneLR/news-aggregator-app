import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const CINCINNATI = { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5 };

let mockUserLocation = { location: null, setLocation: vi.fn(), hydrated: true };
vi.mock("@/lib/useUserLocation", () => ({
  useUserLocation: () => mockUserLocation,
}));

vi.mock("./LocationPicker", () => ({
  default: ({ onPicked, onCancel }) => (
    <div data-testid="location-picker">
      <button type="button" onClick={() => onPicked?.(CINCINNATI)}>
        Mock pick
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </div>
  ),
}));

const { default: LocationSettings } = await import("./LocationSettings");

describe("LocationSettings", () => {
  it("renders nothing until hydrated", () => {
    mockUserLocation = { location: null, setLocation: vi.fn(), hydrated: false };
    const { container } = render(<LocationSettings />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the location picker when there's no saved location", () => {
    mockUserLocation = { location: null, setLocation: vi.fn(), hydrated: true };
    render(<LocationSettings />);

    expect(screen.getByTestId("location-picker")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("shows the saved location's display name with Change/Remove actions", () => {
    mockUserLocation = { location: CINCINNATI, setLocation: vi.fn(), hydrated: true };
    render(<LocationSettings />);

    expect(screen.getByText("Cincinnati, Ohio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("falls back to a generic label when the saved location has no name/state", () => {
    mockUserLocation = { location: { lat: 39.1, lon: -84.5 }, setLocation: vi.fn(), hydrated: true };
    render(<LocationSettings />);

    expect(screen.getByText("Saved location")).toBeInTheDocument();
  });

  it("clicking Change switches to the picker, with Cancel available", async () => {
    const user = userEvent.setup();
    mockUserLocation = { location: CINCINNATI, setLocation: vi.fn(), hydrated: true };
    render(<LocationSettings />);

    await user.click(screen.getByRole("button", { name: "Change" }));

    expect(screen.getByTestId("location-picker")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("clicking Cancel returns to the saved-location view", async () => {
    const user = userEvent.setup();
    mockUserLocation = { location: CINCINNATI, setLocation: vi.fn(), hydrated: true };
    render(<LocationSettings />);

    await user.click(screen.getByRole("button", { name: "Change" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Cincinnati, Ohio")).toBeInTheDocument();
  });

  it("picking a new location in the picker returns to the saved-location view", async () => {
    const user = userEvent.setup();
    mockUserLocation = { location: CINCINNATI, setLocation: vi.fn(), hydrated: true };
    render(<LocationSettings />);

    await user.click(screen.getByRole("button", { name: "Change" }));
    await user.click(screen.getByRole("button", { name: "Mock pick" }));

    expect(screen.getByText("Cincinnati, Ohio")).toBeInTheDocument();
  });

  it("clicking Remove clears the saved location", async () => {
    const user = userEvent.setup();
    const setLocation = vi.fn();
    mockUserLocation = { location: CINCINNATI, setLocation, hydrated: true };
    render(<LocationSettings />);

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(setLocation).toHaveBeenCalledWith(null);
  });
});
