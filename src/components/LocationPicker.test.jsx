import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFetchResponse } from "@/test/fixtures";
import LocationPicker from "./LocationPicker";

const STORAGE_KEY = "morningfeeds:weatherLocation";
const CINCINNATI = { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5 };

describe("LocationPicker", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    delete global.navigator.geolocation;
  });

  it("renders the geolocation button and manual search input", () => {
    render(<LocationPicker />);
    expect(screen.getByRole("button", { name: /use my current location/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search for a city or zip code/i)).toBeInTheDocument();
  });

  it("does not render a Cancel button unless onCancel is provided", () => {
    render(<LocationPicker />);
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders and invokes a Cancel button when onCancel is provided", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<LocationPicker onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });

  it("does not search for a 1-character query", async () => {
    const user = userEvent.setup();
    render(<LocationPicker />);

    await user.type(screen.getByLabelText(/search for a city or zip code/i), "c");
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("searches (debounced) and lists results", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ results: [CINCINNATI], configured: true }));
    render(<LocationPicker />);

    await user.type(screen.getByLabelText(/search for a city or zip code/i), "Cincinnati");

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/weather/search?q=Cincinnati"));
    expect(await screen.findByText("Cincinnati, Ohio, US")).toBeInTheDocument();
  });

  it("clears the query and results, and calls onPicked, after picking a result", async () => {
    const user = userEvent.setup();
    const onPicked = vi.fn();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ results: [CINCINNATI], configured: true }));
    render(<LocationPicker onPicked={onPicked} />);

    await user.type(screen.getByLabelText(/search for a city or zip code/i), "Cincinnati");
    await user.click(await screen.findByText("Cincinnati, Ohio, US"));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(CINCINNATI);
    expect(onPicked).toHaveBeenCalledWith(CINCINNATI);
    expect(screen.getByLabelText(/search for a city or zip code/i)).toHaveValue("");
    expect(screen.queryByText("Cincinnati, Ohio, US")).not.toBeInTheDocument();
  });

  it("resets to empty results when the search fetch rejects", async () => {
    const user = userEvent.setup();
    global.fetch.mockRejectedValueOnce(new Error("network down"));
    render(<LocationPicker />);

    await user.type(screen.getByLabelText(/search for a city or zip code/i), "Cincinnati");

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("calls onSearchResponse with the raw search payload", async () => {
    const user = userEvent.setup();
    const onSearchResponse = vi.fn();
    global.fetch.mockResolvedValueOnce(makeFetchResponse({ results: [], configured: false }));
    render(<LocationPicker onSearchResponse={onSearchResponse} />);

    await user.type(screen.getByLabelText(/search for a city or zip code/i), "Cincinnati");

    await waitFor(() => expect(onSearchResponse).toHaveBeenCalledWith({ results: [], configured: false }));
  });

  it("uses the browser's geolocation, saves the location, and calls onPicked", async () => {
    const user = userEvent.setup();
    const onPicked = vi.fn();
    const getCurrentPosition = vi.fn((onSuccess) => onSuccess({ coords: { latitude: 39.1, longitude: -84.5 } }));
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    render(<LocationPicker onPicked={onPicked} />);

    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(getCurrentPosition).toHaveBeenCalled();
    const expected = { name: null, state: null, country: null, lat: 39.1, lon: -84.5 };
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(expected);
    expect(onPicked).toHaveBeenCalledWith(expected);
  });

  it("shows an error and leaves manual search available when geolocation permission is denied", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((_onSuccess, onError) => onError({ code: 1, PERMISSION_DENIED: 1 }));
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    render(<LocationPicker />);

    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/location access denied/i)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByLabelText(/search for a city or zip code/i)).toBeInTheDocument();
  });

  it("shows a generic error when geolocation fails for a non-permission reason", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((_onSuccess, onError) => onError({ code: 2, PERMISSION_DENIED: 1 }));
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    render(<LocationPicker />);

    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/couldn't get your location/i)).toBeInTheDocument();
  });

  it("shows an error immediately when the browser has no geolocation support", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { ...navigator, geolocation: undefined });
    render(<LocationPicker />);

    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/geolocation isn't supported/i)).toBeInTheDocument();
  });

  it("disables the geolocation button while a location request is in flight", async () => {
    const user = userEvent.setup();
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
    render(<LocationPicker />);

    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByRole("button", { name: /locating…/i })).toBeDisabled();
    await act(async () => resolvePosition());
    await waitFor(() => expect(screen.getByRole("button", { name: /use my current location/i })).toBeEnabled());
  });
});
