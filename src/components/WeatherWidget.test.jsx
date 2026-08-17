import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const STORAGE_KEY = "morningfeeds:weatherLocation";
const CINCINNATI = { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5 };

// LocationPicker has its own dedicated test file covering search/geolocation
// behavior in depth — this file only needs to verify WeatherWidget wires it
// up correctly (shown when expected, callbacks handled), so it's mocked
// down to a few buttons that trigger those callbacks directly.
vi.mock("./LocationPicker", async () => {
  const { useUserLocation } = await import("@/lib/useUserLocation");
  function MockLocationPicker({ onPicked, onCancel, onSearchResponse }) {
    const { setLocation } = useUserLocation();
    return (
      <div data-testid="location-picker">
        <button
          type="button"
          onClick={() => {
            setLocation(CINCINNATI);
            onPicked?.(CINCINNATI);
          }}
        >
          Mock pick Cincinnati
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" onClick={() => onSearchResponse?.({ configured: false, results: [] })}>
          Mock not-configured search
        </button>
      </div>
    );
  }
  return { default: MockLocationPicker };
});

const { default: WeatherWidget } = await import("./WeatherWidget");

describe("WeatherWidget", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a plain location trigger when no location is saved, with the popover closed", async () => {
    render(<WeatherWidget />);
    const trigger = await screen.findByRole("button", { name: /add your location/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the popover with the location picker when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));

    expect(screen.getByRole("dialog", { name: "Weather" })).toBeInTheDocument();
    expect(screen.getByTestId("location-picker")).toBeInTheDocument();
  });

  it("does not show a Cancel option in the picker when there's no saved location yet", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));

    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("picking a location saves it, closes the popover, and fetches/shows conditions", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        configured: true,
        tempF: 72,
        conditionId: 800,
        isDay: true,
        locationName: "Cincinnati",
      })
    );
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.click(screen.getByRole("button", { name: "Mock pick Cincinnati" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/weather?lat=39.1&lon=-84.5"));
    expect(await screen.findByText("72°F")).toBeInTheDocument();
  });

  it("fetches conditions and shows them on the trigger when a location is already saved", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        configured: true,
        tempF: 45,
        conditionId: 601,
        description: "snow",
        isDay: true,
        locationName: "Cincinnati",
      })
    );

    render(<WeatherWidget />);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/weather?lat=39.1&lon=-84.5")
    );
    expect(await screen.findByText("45°F")).toBeInTheDocument();
  });

  it("opens the popover to show full conditions and edit/remove actions for a saved location", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ configured: true, tempF: 45, conditionId: 601, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);
    await screen.findByText("45°F");

    await user.click(screen.getByRole("button", { name: /weather:/i }));

    expect(screen.getByText("Snow in Cincinnati")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change location" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("clicking 'Change location' switches the popover to the picker, with Cancel available", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ configured: true, tempF: 45, conditionId: 601, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);
    await screen.findByText("45°F");

    await user.click(screen.getByRole("button", { name: /weather:/i }));
    await user.click(screen.getByRole("button", { name: "Change location" }));

    expect(screen.getByTestId("location-picker")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("clicking Cancel in the picker returns to the conditions view without changing anything", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValue(
      makeFetchResponse({ configured: true, tempF: 45, conditionId: 601, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);
    await screen.findByText("45°F");

    await user.click(screen.getByRole("button", { name: /weather:/i }));
    await user.click(screen.getByRole("button", { name: "Change location" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Snow in Cincinnati")).toBeInTheDocument();
  });

  it("clicking 'Remove' clears the saved location", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ configured: true, tempF: 45, conditionId: 601, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);
    await screen.findByText("45°F");

    await user.click(screen.getByRole("button", { name: /weather:/i }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add your location/i })).toBeInTheDocument()
    );
  });

  it("closes the popover on an outside click", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the popover on Escape", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders nothing once the picker reports the weather API isn't configured", async () => {
    const user = userEvent.setup();
    const { container } = render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.click(screen.getByRole("button", { name: "Mock not-configured search" }));

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing if the saved-location conditions fetch says the API isn't configured", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ configured: false }));

    const { container } = render(<WeatherWidget />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
