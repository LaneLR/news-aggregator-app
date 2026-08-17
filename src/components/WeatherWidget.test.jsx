import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const { default: WeatherWidget } = await import("./WeatherWidget");

const STORAGE_KEY = "morningfeeds:weatherLocation";
const CINCINNATI = { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5 };

describe("WeatherWidget", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    delete global.navigator.geolocation;
  });

  it("shows a plain location trigger when no location is saved, with the popover closed", async () => {
    render(<WeatherWidget />);
    const trigger = await screen.findByRole("button", { name: /add your location/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the popover with a search input when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));

    expect(screen.getByRole("dialog", { name: "Weather" })).toBeInTheDocument();
    expect(screen.getByLabelText(/search for a city or zip code/i)).toBeInTheDocument();
  });

  it("searches for a location (debounced) and lists results", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ results: [CINCINNATI], configured: true })
    );
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.type(screen.getByLabelText(/search for a city or zip code/i), "Cincinnati");

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/weather/search?q=Cincinnati")
    );
    expect(await screen.findByText("Cincinnati, Ohio, US")).toBeInTheDocument();
  });

  it("does not search for a 1-character query", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.type(screen.getByLabelText(/search for a city or zip code/i), "c");
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("picking a search result saves the location, closes the popover, and updates the trigger", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ results: [CINCINNATI], configured: true })
    );
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({
        configured: true,
        tempF: 72,
        conditionId: 800,
        description: "clear sky",
        isDay: true,
        locationName: "Cincinnati",
      })
    );
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.type(screen.getByLabelText(/search for a city or zip code/i), "Cincinnati");
    await user.click(await screen.findByText("Cincinnati, Ohio, US"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(CINCINNATI);
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

  it("clicking 'Change location' switches the popover to search mode", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ configured: true, tempF: 45, conditionId: 601, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);
    await screen.findByText("45°F");

    await user.click(screen.getByRole("button", { name: /weather:/i }));
    await user.click(screen.getByRole("button", { name: "Change location" }));

    expect(screen.getByLabelText(/search for a city or zip code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
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

  it("renders nothing once a search confirms the API isn't configured", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ results: [], configured: false }));
    const { container } = render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.type(screen.getByLabelText(/search for a city or zip code/i), "Cincinnati");

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing if the saved-location conditions fetch says the API isn't configured", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ configured: false }));

    const { container } = render(<WeatherWidget />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("uses the browser's geolocation to save a location and fetch conditions", async () => {
    const getCurrentPosition = vi.fn((onSuccess) =>
      onSuccess({ coords: { latitude: 39.1, longitude: -84.5 } })
    );
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ configured: true, tempF: 72, conditionId: 800, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(getCurrentPosition).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual({
      name: null,
      state: null,
      country: null,
      lat: 39.1,
      lon: -84.5,
    });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/weather?lat=39.1&lon=-84.5")
    );
    expect(await screen.findByText("72°F")).toBeInTheDocument();
  });

  it("shows an error and leaves manual search available when geolocation permission is denied", async () => {
    const getCurrentPosition = vi.fn((_onSuccess, onError) => onError({ code: 1, PERMISSION_DENIED: 1 }));
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/location access denied/i)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByLabelText(/search for a city or zip code/i)).toBeInTheDocument();
  });

  it("shows a generic error when geolocation fails for a non-permission reason", async () => {
    const getCurrentPosition = vi.fn((_onSuccess, onError) => onError({ code: 2, PERMISSION_DENIED: 1 }));
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/couldn't get your location/i)).toBeInTheDocument();
  });

  it("shows an error immediately when the browser has no geolocation support", async () => {
    vi.stubGlobal("navigator", { ...navigator, geolocation: undefined });
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/geolocation isn't supported/i)).toBeInTheDocument();
  });

  it("disables the geolocation button while a location request is in flight", async () => {
    let resolvePosition;
    const getCurrentPosition = vi.fn(
      (onSuccess) =>
        new Promise((resolve) => {
          resolvePosition = () => {
            onSuccess({ coords: { latitude: 39.1, longitude: -84.5 } });
            resolve();
          };
        })
    );
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ configured: true, tempF: 72, conditionId: 800, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByRole("button", { name: /locating…/i })).toBeDisabled();
    await act(async () => resolvePosition());
    await waitFor(() => expect(screen.getByText("72°F")).toBeInTheDocument());
  });
});
