import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";

const { default: WeatherWidget } = await import("./WeatherWidget");

const STORAGE_KEY = "morningfeeds:weatherLocation";
const CINCINNATI = { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5 };

describe("WeatherWidget", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a location search prompt when no location is saved", async () => {
    render(<WeatherWidget />);
    expect(await screen.findByPlaceholderText(/add your location/i)).toBeInTheDocument();
  });

  it("searches for a location (debounced) and lists results", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ results: [CINCINNATI], configured: true })
    );
    render(<WeatherWidget />);

    await user.type(await screen.findByPlaceholderText(/add your location/i), "Cincinnati");

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/weather/search?q=Cincinnati")
    );
    expect(await screen.findByText("Cincinnati, Ohio, US")).toBeInTheDocument();
  });

  it("does not search for a 1-character query", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.type(await screen.findByPlaceholderText(/add your location/i), "c");
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("picking a search result saves the location and shows current conditions", async () => {
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

    await user.type(await screen.findByPlaceholderText(/add your location/i), "Cincinnati");
    await user.click(await screen.findByText("Cincinnati, Ohio, US"));

    expect(await screen.findByText("72°F")).toBeInTheDocument();
    expect(screen.getByText("Clear in Cincinnati")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(CINCINNATI);
  });

  it("fetches and shows conditions on mount when a location is already saved", async () => {
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
    expect(screen.getByText("Snow in Cincinnati")).toBeInTheDocument();
  });

  it("clicking the pencil icon goes back to search mode", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ configured: true, tempF: 45, conditionId: 601, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);
    await screen.findByText("45°F");

    await user.click(screen.getByRole("button", { name: "Change weather location" }));

    expect(screen.getByPlaceholderText(/add your location/i)).toBeInTheDocument();
  });

  it("clicking the remove icon clears the saved location", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ configured: true, tempF: 45, conditionId: 601, isDay: true, locationName: "Cincinnati" })
    );
    const user = userEvent.setup();
    render(<WeatherWidget />);
    await screen.findByText("45°F");

    await user.click(screen.getByRole("button", { name: "Remove weather location" }));

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByPlaceholderText(/add your location/i)).toBeInTheDocument();
  });

  it("renders nothing once a search confirms the API isn't configured", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ results: [], configured: false }));
    const { container } = render(<WeatherWidget />);

    await user.type(await screen.findByPlaceholderText(/add your location/i), "Cincinnati");

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing if the saved-location conditions fetch says the API isn't configured", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ configured: false }));

    const { container } = render(<WeatherWidget />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
