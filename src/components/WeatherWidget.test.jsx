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
    expect(screen.getByPlaceholderText(/add your location/i)).toBeInTheDocument();
  });

  it("searches for a location (debounced) and lists results", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(
      makeFetchResponse({ results: [CINCINNATI], configured: true })
    );
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.type(screen.getByPlaceholderText(/add your location/i), "Cincinnati");

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/weather/search?q=Cincinnati")
    );
    expect(await screen.findByText("Cincinnati, Ohio, US")).toBeInTheDocument();
  });

  it("does not search for a 1-character query", async () => {
    const user = userEvent.setup();
    render(<WeatherWidget />);

    await user.click(await screen.findByRole("button", { name: /add your location/i }));
    await user.type(screen.getByPlaceholderText(/add your location/i), "c");
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
    await user.type(screen.getByPlaceholderText(/add your location/i), "Cincinnati");
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

    expect(screen.getByPlaceholderText(/add your location/i)).toBeInTheDocument();
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
    await user.type(screen.getByPlaceholderText(/add your location/i), "Cincinnati");

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing if the saved-location conditions fetch says the API isn't configured", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CINCINNATI));
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ configured: false }));

    const { container } = render(<WeatherWidget />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
