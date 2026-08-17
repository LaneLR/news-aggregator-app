import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useUserLocation } from "./useUserLocation";

const SAMPLE = { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5 };

describe("useUserLocation", () => {
  it("starts with no location and becomes hydrated after mount", () => {
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toBeNull();
    expect(result.current.hydrated).toBe(true);
  });

  it("reads a previously saved location from localStorage on mount", () => {
    localStorage.setItem("morningfeeds:weatherLocation", JSON.stringify(SAMPLE));
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toEqual(SAMPLE);
  });

  it("falls back to no location for malformed stored JSON", () => {
    localStorage.setItem("morningfeeds:weatherLocation", "{not valid");
    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toBeNull();
  });

  it("setLocation persists the new location", () => {
    const { result } = renderHook(() => useUserLocation());

    act(() => {
      result.current.setLocation(SAMPLE);
    });

    expect(result.current.location).toEqual(SAMPLE);
    expect(JSON.parse(localStorage.getItem("morningfeeds:weatherLocation"))).toEqual(SAMPLE);
  });

  it("setLocation(null) clears the saved location", () => {
    const { result } = renderHook(() => useUserLocation());
    act(() => {
      result.current.setLocation(SAMPLE);
    });

    act(() => {
      result.current.setLocation(null);
    });

    expect(result.current.location).toBeNull();
    expect(localStorage.getItem("morningfeeds:weatherLocation")).toBeNull();
  });

  it("keeps two independently-mounted instances in sync via the change event", () => {
    const a = renderHook(() => useUserLocation());
    const b = renderHook(() => useUserLocation());

    act(() => {
      a.result.current.setLocation(SAMPLE);
    });

    expect(b.result.current.location).toEqual(SAMPLE);

    act(() => {
      b.result.current.setLocation(null);
    });

    expect(a.result.current.location).toBeNull();
  });
});
