import { describe, expect, it, vi, beforeEach } from "vitest";
import { makeFetchResponse } from "@/test/fixtures";
import {
  getMarketQuotes,
  getSectorQuotes,
  getWatchlistQuotes,
  TRACKED_SECTORS,
  TRACKED_INDICES,
} from "./marketData";

function makeQuoteRow(overrides = {}) {
  const data = {
    symbol: "SPY",
    displayName: "S&P 500",
    sortOrder: 0,
    price: 500,
    change: 1.2,
    changePercent: 0.24,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
  return { ...data, toJSON: () => data };
}

function makeMarketQuoteModel(rows = []) {
  return {
    findAll: vi.fn().mockResolvedValue(rows),
    upsert: vi.fn().mockResolvedValue([{ updatedAt: new Date() }]),
  };
}

describe("getMarketQuotes", () => {
  beforeEach(() => {
    vi.stubEnv("FINNHUB_API_KEY", "test-key");
  });

  it("returns configured: false when FINNHUB_API_KEY is missing", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "");
    const MarketQuote = makeMarketQuoteModel();
    const result = await getMarketQuotes(MarketQuote);
    expect(result).toEqual({ quotes: [], lastUpdated: null, configured: false });
    expect(MarketQuote.findAll).not.toHaveBeenCalled();
  });

  it("serves cached quotes without refetching when fresh", async () => {
    const rows = TRACKED_INDICES.map((d) => makeQuoteRow({ symbol: d.symbol, displayName: d.displayName }));
    const MarketQuote = makeMarketQuoteModel(rows);

    const result = await getMarketQuotes(MarketQuote);
    expect(result.configured).toBe(true);
    expect(result.quotes.length).toBe(TRACKED_INDICES.length);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("refreshes stale/missing quotes from Finnhub and returns them", async () => {
    const MarketQuote = makeMarketQuoteModel([]);
    global.fetch = vi.fn(() =>
      Promise.resolve(makeFetchResponse({ c: 100, d: 1, dp: 1.5 }))
    );
    MarketQuote.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(
        TRACKED_INDICES.map((d) => makeQuoteRow({ symbol: d.symbol, displayName: d.displayName }))
      );

    const result = await getMarketQuotes(MarketQuote);
    expect(global.fetch).toHaveBeenCalledTimes(TRACKED_INDICES.length);
    expect(MarketQuote.upsert).toHaveBeenCalledTimes(TRACKED_INDICES.length);
    expect(result.quotes.length).toBe(TRACKED_INDICES.length);
  });

  it("treats an all-zero Finnhub response as a failure, not a real $0 quote", async () => {
    const MarketQuote = makeMarketQuoteModel([]);
    global.fetch = vi.fn(() => Promise.resolve(makeFetchResponse({ c: 0, d: 0, dp: 0 })));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getMarketQuotes(MarketQuote);
    expect(MarketQuote.upsert).not.toHaveBeenCalled();
    expect(result.quotes).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("throws-safe: a non-ok fetch response for one symbol doesn't block the others", async () => {
    const MarketQuote = makeMarketQuoteModel([]);
    let call = 0;
    global.fetch = vi.fn(() => {
      call += 1;
      if (call === 1) return Promise.resolve(makeFetchResponse(null, { ok: false, status: 500 }));
      return Promise.resolve(makeFetchResponse({ c: 50, d: 0.5, dp: 1 }));
    });

    await getMarketQuotes(MarketQuote);
    // One symbol fails, the rest still get upserted.
    expect(MarketQuote.upsert).toHaveBeenCalledTimes(TRACKED_INDICES.length - 1);
  });

  it("serves cached (stale) data if the refresh attempt itself throws", async () => {
    const staleRow = makeQuoteRow({
      symbol: TRACKED_INDICES[0].symbol,
      updatedAt: new Date(Date.now() - 999 * 60 * 1000).toISOString(),
    });
    const MarketQuote = makeMarketQuoteModel([staleRow]);
    MarketQuote.findAll.mockResolvedValueOnce([staleRow]);
    global.fetch = vi.fn(() => {
      throw new Error("network exploded");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getMarketQuotes(MarketQuote);
    // refreshQuotes uses Promise.allSettled internally so a synchronous
    // throw in fetchQuote still resolves that entry as "rejected", not an
    // uncaught error - getQuotesForSymbols itself should not throw either,
    // and the previously-cached row is still served.
    expect(consoleSpy).toHaveBeenCalled();
    expect(result.quotes.length).toBe(1);
    expect(result.quotes[0].symbol).toBe(staleRow.symbol);
  });
});

describe("getSectorQuotes", () => {
  it("returns configured: false when FINNHUB_API_KEY is missing", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "");
    const MarketQuote = makeMarketQuoteModel();
    const result = await getSectorQuotes(MarketQuote);
    expect(result).toEqual({ quotes: [], lastUpdated: null, configured: false });
  });

  it("fetches quotes for the tracked sector descriptors", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "test-key");
    const rows = TRACKED_SECTORS.map((d) => makeQuoteRow({ symbol: d.symbol, displayName: d.displayName }));
    const MarketQuote = makeMarketQuoteModel(rows);

    const result = await getSectorQuotes(MarketQuote);
    expect(result.configured).toBe(true);
    expect(result.quotes.length).toBe(TRACKED_SECTORS.length);
  });
});

describe("getWatchlistQuotes", () => {
  it("returns configured: false when FINNHUB_API_KEY is missing", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "");
    const MarketQuote = makeMarketQuoteModel();
    const result = await getWatchlistQuotes(MarketQuote, ["AAPL"]);
    expect(result).toEqual({ quotes: [], lastUpdated: null, configured: false });
  });

  it("builds descriptors from arbitrary symbols and returns their quotes", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "test-key");
    const rows = [makeQuoteRow({ symbol: "AAPL", displayName: "AAPL" })];
    const MarketQuote = makeMarketQuoteModel(rows);

    const result = await getWatchlistQuotes(MarketQuote, ["AAPL"]);
    expect(result.configured).toBe(true);
    expect(result.quotes[0].symbol).toBe("AAPL");
  });

  it("returns an empty quote list for an empty symbol array", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "test-key");
    const MarketQuote = makeMarketQuoteModel([]);
    const result = await getWatchlistQuotes(MarketQuote, []);
    expect(result).toEqual({ quotes: [], lastUpdated: null, configured: true });
  });
});
