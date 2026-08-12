import { describe, expect, it } from "vitest";
import { getWeatherDisplay } from "./weatherCodes";

describe("getWeatherDisplay", () => {
  it("maps thunderstorm codes (2xx)", () => {
    expect(getWeatherDisplay(211).label).toBe("Thunderstorm");
  });

  it("maps drizzle codes (3xx)", () => {
    expect(getWeatherDisplay(301).label).toBe("Drizzle");
  });

  it("maps rain codes (5xx)", () => {
    expect(getWeatherDisplay(501).label).toBe("Rain");
  });

  it("maps snow codes (6xx)", () => {
    expect(getWeatherDisplay(601).label).toBe("Snow");
  });

  it("maps atmosphere codes (7xx) to Haze", () => {
    expect(getWeatherDisplay(741).label).toBe("Haze");
  });

  it("maps clear (800) to a day or night icon depending on isDay", () => {
    expect(getWeatherDisplay(800, true).label).toBe("Clear");
    const day = getWeatherDisplay(800, true).Icon;
    const night = getWeatherDisplay(800, false).Icon;
    expect(day).toBeDefined();
    expect(night).toBeDefined();
    expect(day).not.toBe(night);
  });

  it("maps partly cloudy (801) to a day or night icon depending on isDay", () => {
    const day = getWeatherDisplay(801, true).Icon;
    const night = getWeatherDisplay(801, false).Icon;
    expect(day).not.toBe(night);
  });

  it("maps overcast codes (802-804) to Cloudy", () => {
    expect(getWeatherDisplay(803).label).toBe("Cloudy");
  });

  it("falls back to Unknown for an unrecognized code", () => {
    expect(getWeatherDisplay(999).label).toBe("Unknown");
  });
});
