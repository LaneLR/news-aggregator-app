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
