import { describe, expect, it } from "vitest";
import { resolveHubCity } from "./resolveHubCity";

describe("resolveHubCity", () => {
  it("resolves Porterville, CA to Bakersfield, not the farther-but-larger Sacramento", () => {
    const porterville = { lat: 36.0652, lon: -119.0168 };
    expect(resolveHubCity(porterville)?.id).toBe("bakersfield");
  });

  it("resolves a point exactly at a hub city's coordinates to that hub", () => {
    expect(resolveHubCity({ lat: 40.71, lon: -74.01 })?.id).toBe("new-york");
  });

  it("resolves a point between several hubs to exactly one nearest result", () => {
    const midpoint = { lat: 41.3, lon: -80.0 };
    const result = resolveHubCity(midpoint);
    expect(result).not.toBeNull();
    expect(typeof result.id).toBe("string");
  });

  it("returns null for missing or non-numeric coordinates", () => {
    expect(resolveHubCity({ lat: null, lon: -97 })).toBeNull();
    expect(resolveHubCity({ lat: 32, lon: undefined })).toBeNull();
    expect(resolveHubCity({ lat: NaN, lon: -97 })).toBeNull();
    expect(resolveHubCity({})).toBeNull();
  });
});
