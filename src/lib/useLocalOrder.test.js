import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useLocalOrder } from "./useLocalOrder";

describe("useLocalOrder", () => {
  it("starts empty when localStorage has nothing saved", () => {
    const { result } = renderHook(() => useLocalOrder("test-key"));
    expect(result.current[0]).toEqual([]);
  });

  it("reads a previously saved order synchronously on mount", () => {
    localStorage.setItem("test-key", JSON.stringify(["b", "a", "c"]));
    const { result } = renderHook(() => useLocalOrder("test-key"));
    expect(result.current[0]).toEqual(["b", "a", "c"]);
  });

  it("persists a new order to localStorage and updates state", () => {
    const { result } = renderHook(() => useLocalOrder("test-key"));

    act(() => {
      result.current[1](["x", "y"]);
    });

    expect(result.current[0]).toEqual(["x", "y"]);
    expect(JSON.parse(localStorage.getItem("test-key"))).toEqual(["x", "y"]);
  });

  it("falls back to an empty array for malformed stored JSON", () => {
    localStorage.setItem("test-key", "{not valid json");
    const { result } = renderHook(() => useLocalOrder("test-key"));
    expect(result.current[0]).toEqual([]);
  });
});
