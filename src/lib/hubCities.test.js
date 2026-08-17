import { describe, expect, it } from "vitest";
import { HUB_CITIES } from "./hubCities";

describe("HUB_CITIES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(HUB_CITIES)).toBe(true);
    expect(HUB_CITIES.length).toBeGreaterThan(0);
  });

  it("every entry has a unique id and valid coordinates", () => {
    const ids = new Set();
    for (const city of HUB_CITIES) {
      expect(typeof city.id).toBe("string");
      expect(city.id.length).toBeGreaterThan(0);
      expect(ids.has(city.id)).toBe(false);
      ids.add(city.id);

      expect(typeof city.name).toBe("string");
      expect(typeof city.state).toBe("string");
      expect(city.lat).toBeGreaterThanOrEqual(-90);
      expect(city.lat).toBeLessThanOrEqual(90);
      expect(city.lon).toBeGreaterThanOrEqual(-180);
      expect(city.lon).toBeLessThanOrEqual(180);
    }
  });

  it("includes Bakersfield and Sacramento, needed to disambiguate nearby users", () => {
    const ids = HUB_CITIES.map((c) => c.id);
    expect(ids).toContain("bakersfield");
    expect(ids).toContain("sacramento");
  });
});
