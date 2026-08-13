import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

const { GET } = await import("./route");

function makeRequest(qs) {
  return new NextRequest(`http://localhost/api/weather/search?${qs}`);
}

describe("GET /api/weather/search", () => {
  const originalKey = process.env.OPENWEATHER_API_KEY;

  beforeEach(() => {
    process.env.OPENWEATHER_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENWEATHER_API_KEY;
    else process.env.OPENWEATHER_API_KEY = originalKey;
  });

  it("returns configured:false without calling out when no API key is set", async () => {
    delete process.env.OPENWEATHER_API_KEY;

    const res = await GET(makeRequest("q=Cincinnati"));
    const body = await res.json();

    expect(body).toEqual({ results: [], configured: false });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns an empty list for a too-short query without calling out", async () => {
    const res = await GET(makeRequest("q=c"));
    const body = await res.json();

    expect(body.results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("normalizes results from the OpenWeatherMap geocoding API", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5, local_names: {} },
      ],
    });

    const res = await GET(makeRequest("q=Cincinnati"));
    const body = await res.json();

    expect(body.configured).toBe(true);
    expect(body.results).toEqual([
      { name: "Cincinnati", state: "Ohio", country: "US", lat: 39.1, lon: -84.5 },
    ]);
  });

  it("routes a 5-digit query to OpenWeather's zip endpoint instead of city search", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ zip: "45202", name: "Cincinnati", lat: 39.1072, lon: -84.502, country: "US" }),
    });

    const res = await GET(makeRequest("q=45202"));
    const body = await res.json();

    expect(global.fetch.mock.calls[0][0]).toContain("/geo/1.0/zip?zip=45202,US");
    expect(body.results).toEqual([
      { name: "Cincinnati", state: null, country: "US", lat: 39.1072, lon: -84.502 },
    ]);
  });

  it("also routes a ZIP+4 query to the zip endpoint, using only the first 5 digits", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ zip: "45202", name: "Cincinnati", lat: 39.1072, lon: -84.502, country: "US" }),
    });

    await GET(makeRequest("q=45202-1234"));

    expect(global.fetch.mock.calls[0][0]).toContain("/geo/1.0/zip?zip=45202,US");
  });

  it("returns an empty (not error) result for a nonexistent zip code", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const res = await GET(makeRequest("q=00000"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ results: [], configured: true });
  });

  it("returns 502 when the upstream request fails", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const res = await GET(makeRequest("q=Cincinnati"));

    expect(res.status).toBe(502);
  });

  it("returns 500 on an unexpected error", async () => {
    global.fetch.mockRejectedValueOnce(new Error("network down"));

    const res = await GET(makeRequest("q=Cincinnati"));

    expect(res.status).toBe(500);
  });
});
