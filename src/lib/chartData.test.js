import { describe, expect, it, vi } from "vitest";
import { makeFetchResponse } from "@/test/fixtures";
import { getChartRange, CHART_RANGES } from "./chartData";

function makeYahooBody(points) {
  return {
    chart: {
      result: [
        {
          timestamp: points.map((p) => p.t),
          indicators: { quote: [{ close: points.map((p) => p.price) }] },
        },
      ],
    },
  };
}

function makeCacheModel({ cached = null } = {}) {
  return {
    findOne: vi.fn().mockResolvedValue(cached),
    upsert: vi.fn().mockResolvedValue([{ updatedAt: new Date() }]),
  };
}

describe("getChartRange", () => {
  it("throws for an unknown range", async () => {
    const MarketChartCache = makeCacheModel();
    await expect(getChartRange(MarketChartCache, "SPY", "bogus")).rejects.toThrow(
      "Unknown chart range"
    );
  });

  it("serves the cached row without fetching when fresh", async () => {
    const cached = {
      points: [{ t: "2026-01-01T00:00:00.000Z", price: 100 }],
      updatedAt: new Date(),
    };
    const MarketChartCache = makeCacheModel({ cached });

    const result = await getChartRange(MarketChartCache, "SPY", "1d");
    expect(result.points).toEqual(cached.points);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches fresh data from Yahoo when the cache is stale, and upserts it", async () => {
    const staleCached = {
      points: [{ t: "2025-01-01T00:00:00.000Z", price: 50 }],
      updatedAt: new Date(Date.now() - 999 * 60 * 60 * 1000),
    };
    const MarketChartCache = makeCacheModel({ cached: staleCached });
    global.fetch = vi.fn(() =>
      Promise.resolve(
        makeFetchResponse(makeYahooBody([{ t: 1735689600, price: 123.45 }]))
      )
    );

    const result = await getChartRange(MarketChartCache, "SPY", "1mo");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(MarketChartCache.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: "SPY", rangeKey: "1mo" })
    );
    expect(result.points[0].price).toBe(123.45);
  });

  it("fetches fresh data when nothing is cached yet", async () => {
    const MarketChartCache = makeCacheModel({ cached: null });
    global.fetch = vi.fn(() =>
      Promise.resolve(makeFetchResponse(makeYahooBody([{ t: 1735689600, price: 10 }])))
    );

    const result = await getChartRange(MarketChartCache, "QQQ", "5d");
    expect(result.points.length).toBe(1);
  });

  it("falls back to stale cached data when the fetch fails", async () => {
    const staleCached = {
      points: [{ t: "2025-01-01T00:00:00.000Z", price: 50 }],
      updatedAt: new Date(Date.now() - 999 * 60 * 60 * 1000),
    };
    const MarketChartCache = makeCacheModel({ cached: staleCached });
    global.fetch = vi.fn(() => Promise.resolve(makeFetchResponse(null, { ok: false, status: 500 })));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getChartRange(MarketChartCache, "SPY", "1y");
    expect(result.points).toEqual(staleCached.points);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("returns empty points when the fetch fails and nothing is cached", async () => {
    const MarketChartCache = makeCacheModel({ cached: null });
    global.fetch = vi.fn(() => Promise.resolve(makeFetchResponse(null, { ok: false, status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getChartRange(MarketChartCache, "SPY", "10y");
    expect(result).toEqual({ points: [], updatedAt: null });
  });

  it("treats a chart.error payload as a failure", async () => {
    const MarketChartCache = makeCacheModel({ cached: null });
    global.fetch = vi.fn(() =>
      Promise.resolve(makeFetchResponse({ chart: { error: { description: "Not found" } } }))
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getChartRange(MarketChartCache, "BOGUS", "max");
    expect(result).toEqual({ points: [], updatedAt: null });
  });

  it("filters out timestamps with a non-numeric close price", async () => {
    const MarketChartCache = makeCacheModel({ cached: null });
    global.fetch = vi.fn(() =>
      Promise.resolve(
        makeFetchResponse({
          chart: {
            result: [
              {
                timestamp: [1735689600, 1735776000],
                indicators: { quote: [{ close: [100, null] }] },
              },
            ],
          },
        })
      )
    );

    const result = await getChartRange(MarketChartCache, "SPY", "1mo");
    expect(result.points.length).toBe(1);
    expect(result.points[0].price).toBe(100);
  });

  it("aborts the Yahoo request if it takes longer than the timeout", async () => {
    vi.useFakeTimers();
    try {
      const MarketChartCache = makeCacheModel({ cached: null });
      global.fetch = vi.fn(
        (url, opts) =>
          new Promise((resolve, reject) => {
            opts.signal.addEventListener("abort", () => {
              const err = new Error("The operation was aborted");
              err.name = "AbortError";
              reject(err);
            });
          })
      );
      vi.spyOn(console, "error").mockImplementation(() => {});

      const resultPromise = getChartRange(MarketChartCache, "SPY", "1d");
      await vi.advanceTimersByTimeAsync(8000);
      const result = await resultPromise;

      expect(result).toEqual({ points: [], updatedAt: null });
    } finally {
      vi.useRealTimers();
    }
  });

  it("exposes a config entry for every documented range", () => {
    for (const range of ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "10y", "max"]) {
      expect(CHART_RANGES[range]).toBeDefined();
    }
  });
});
