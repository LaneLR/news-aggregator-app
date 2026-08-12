import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWeatherLocation } from "./useWeatherLocation";

const SAMPLE = { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5 };

describe("useWeatherLocation", () => {
  it("starts with no location and becomes hydrated after mount", () => {
    const { result } = renderHook(() => useWeatherLocation());
    expect(result.current.location).toBeNull();
    expect(result.current.hydrated).toBe(true);
  });

  it("reads a previously saved location from localStorage on mount", () => {
    localStorage.setItem("morningfeeds:weatherLocation", JSON.stringify(SAMPLE));
    const { result } = renderHook(() => useWeatherLocation());
    expect(result.current.location).toEqual(SAMPLE);
  });

  it("falls back to no location for malformed stored JSON", () => {
    localStorage.setItem("morningfeeds:weatherLocation", "{not valid");
    const { result } = renderHook(() => useWeatherLocation());
    expect(result.current.location).toBeNull();
  });

  it("setLocation persists the new location", () => {
    const { result } = renderHook(() => useWeatherLocation());

    act(() => {
      result.current.setLocation(SAMPLE);
    });

    expect(result.current.location).toEqual(SAMPLE);
    expect(JSON.parse(localStorage.getItem("morningfeeds:weatherLocation"))).toEqual(SAMPLE);
  });

  it("setLocation(null) clears the saved location", () => {
    const { result } = renderHook(() => useWeatherLocation());
    act(() => {
      result.current.setLocation(SAMPLE);
    });

    act(() => {
      result.current.setLocation(null);
    });

    expect(result.current.location).toBeNull();
    expect(localStorage.getItem("morningfeeds:weatherLocation")).toBeNull();
  });
});
