import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

const { GET } = await import("./route");

function makeRequest(qs) {
  return new NextRequest(`http://localhost/api/weather?${qs}`);
}

describe("GET /api/weather", () => {
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

    const res = await GET(makeRequest("lat=39.1&lon=-84.5"));
    const body = await res.json();

    expect(body).toEqual({ configured: false });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects missing/invalid coordinates", async () => {
    const res = await GET(makeRequest("lat=abc&lon=-84.5"));

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects out-of-range coordinates", async () => {
    const res = await GET(makeRequest("lat=200&lon=-84.5"));

    expect(res.status).toBe(400);
  });

  it("returns normalized current conditions, day", async () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        main: { temp: 71.8 },
        weather: [{ id: 800, description: "clear sky" }],
        sys: { sunrise: nowUnix - 3600, sunset: nowUnix + 3600 },
        name: "Cincinnati",
      }),
    });

    const res = await GET(makeRequest("lat=39.1&lon=-84.5"));
    const body = await res.json();

    expect(body).toEqual({
      configured: true,
      tempF: 72,
      conditionId: 800,
      description: "clear sky",
      isDay: true,
      locationName: "Cincinnati",
    });
  });

  it("marks isDay false when it's currently before sunrise or after sunset", async () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        main: { temp: 50 },
        weather: [{ id: 800, description: "clear sky" }],
        sys: { sunrise: nowUnix + 3600, sunset: nowUnix + 7200 },
        name: "Cincinnati",
      }),
    });

    const res = await GET(makeRequest("lat=39.1&lon=-84.5"));
    const body = await res.json();

    expect(body.isDay).toBe(false);
  });

  it("returns 502 when the upstream request fails", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const res = await GET(makeRequest("lat=39.1&lon=-84.5"));

    expect(res.status).toBe(502);
  });

  it("returns 500 on an unexpected error", async () => {
    global.fetch.mockRejectedValueOnce(new Error("network down"));

    const res = await GET(makeRequest("lat=39.1&lon=-84.5"));

    expect(res.status).toBe(500);
  });
});
