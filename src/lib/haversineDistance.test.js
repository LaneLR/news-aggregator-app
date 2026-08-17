import { describe, expect, it } from "vitest";
import { haversineDistance } from "./haversineDistance";

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistance({ lat: 32.85, lon: -97.05 }, { lat: 32.85, lon: -97.05 })).toBe(0);
  });

  it("returns the known great-circle distance between Dallas and Houston (~225 miles)", () => {
    const dallas = { lat: 32.7767, lon: -96.797 };
    const houston = { lat: 29.7604, lon: -95.3698 };
    const distance = haversineDistance(dallas, houston);
    expect(distance).toBeGreaterThan(200);
    expect(distance).toBeLessThan(250);
  });

  it("is symmetric", () => {
    const a = { lat: 38.58, lon: -121.49 };
    const b = { lat: 35.37, lon: -119.02 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 10);
  });
});
