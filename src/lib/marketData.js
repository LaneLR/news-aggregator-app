import { TRACKED_INDICES } from "./marketIndices.js";

export { TRACKED_INDICES };

// Shared, lazily-refreshed market snapshot for the Market category page —
// see MarketTicker.jsx / api/market/indices/route.js. Refreshed by whichever
// request happens to arrive after the cache goes stale, not per-visitor, so
// N people looking at the Market page at once still only costs one round of
// provider calls per REFRESH_INTERVAL_MS.
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

// SPDR Select Sector ETFs — same "ETF as sector proxy" reasoning as the
// index tickers above: ordinary, unrestricted market data instead of a
// separately-licensed sector index feed.
export const TRACKED_SECTORS = [
  { symbol: "XLK", displayName: "Technology", sortOrder: 0 },
  { symbol: "XLF", displayName: "Financials", sortOrder: 1 },
  { symbol: "XLV", displayName: "Health Care", sortOrder: 2 },
  { symbol: "XLY", displayName: "Consumer Discretionary", sortOrder: 3 },
  { symbol: "XLP", displayName: "Consumer Staples", sortOrder: 4 },
  { symbol: "XLE", displayName: "Energy", sortOrder: 5 },
  { symbol: "XLI", displayName: "Industrials", sortOrder: 6 },
  { symbol: "XLB", displayName: "Materials", sortOrder: 7 },
  { symbol: "XLU", displayName: "Utilities", sortOrder: 8 },
  { symbol: "XLRE", displayName: "Real Estate", sortOrder: 9 },
  { symbol: "XLC", displayName: "Communication Services", sortOrder: 10 },
];

async function fetchQuote(symbol, apiKey) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`Finnhub request failed for ${symbol}: ${res.status}`);
  }
  const data = await res.json();
  // Finnhub returns all-zero fields (not an error status) for an unknown
  // symbol or when its free tier can't serve one — treat that as a failure
  // rather than caching a fake $0 quote.
  if (typeof data.c !== "number" || data.c === 0) {
    throw new Error(`Finnhub returned no data for ${symbol}`);
  }
  return { price: data.c, change: data.d, changePercent: data.dp };
}

async function refreshQuotes(MarketQuote, descriptors, apiKey) {
  const results = await Promise.allSettled(
    descriptors.map(async (descriptor) => ({
      ...descriptor,
      ...(await fetchQuote(descriptor.symbol, apiKey)),
    }))
  );

  await Promise.all(
    results.map((result, i) => {
      if (result.status !== "fulfilled") {
        console.error(
          `Market data refresh failed for ${descriptors[i].symbol}:`,
          result.reason
        );
        return null;
      }
      const { symbol, displayName, sortOrder, price, change, changePercent } = result.value;
      return MarketQuote.upsert({ symbol, displayName, sortOrder, price, change, changePercent });
    })
  );
}

// Shared by both the fixed index ticker and per-user watchlists: takes a
// list of { symbol, displayName, sortOrder } descriptors, refreshes
// whichever of them are missing or older than REFRESH_INTERVAL_MS, and
// returns quotes in the same order as `descriptors`. Two users whose
// watchlists both include AAPL still only cost one Finnhub call per
// refresh window between them, same as the index ticker.
async function getQuotesForSymbols(MarketQuote, descriptors) {
  if (descriptors.length === 0) return { quotes: [], lastUpdated: null };

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return { quotes: [], lastUpdated: null, configured: false };

  const symbols = descriptors.map((d) => d.symbol);
  let rows = await MarketQuote.findAll({ where: { symbol: symbols } });
  const bySymbol = new Map(rows.map((r) => [r.symbol, r]));

  const staleCutoff = Date.now() - REFRESH_INTERVAL_MS;
  const needsRefresh = descriptors.filter((d) => {
    const row = bySymbol.get(d.symbol);
    return !row || new Date(row.updatedAt).getTime() < staleCutoff;
  });

  if (needsRefresh.length > 0) {
    try {
      await refreshQuotes(MarketQuote, needsRefresh, apiKey);
      rows = await MarketQuote.findAll({ where: { symbol: symbols } });
      bySymbol.clear();
      rows.forEach((r) => bySymbol.set(r.symbol, r));
    } catch (err) {
      // Serve whatever's already cached rather than nothing if the refresh
      // itself throws (e.g. the whole provider is unreachable).
      console.error("Market data refresh failed, serving cached data:", err);
    }
  }

  const quotes = descriptors
    .map((d) => bySymbol.get(d.symbol))
    .filter(Boolean)
    .map((row) => row.toJSON());

  const lastUpdated = quotes.reduce((latest, q) => {
    const t = new Date(q.updatedAt).getTime();
    return t > latest ? t : latest;
  }, 0);

  return {
    quotes,
    lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
  };
}

// `configured: false` lets the UI show "not set up yet" instead of an empty
// chart when FINNHUB_API_KEY is missing — this is meant to work the moment
// someone adds a key, not require a code change too.
export async function getMarketQuotes(MarketQuote) {
  if (!process.env.FINNHUB_API_KEY) {
    return { quotes: [], lastUpdated: null, configured: false };
  }
  const result = await getQuotesForSymbols(MarketQuote, TRACKED_INDICES);
  return { ...result, configured: true };
}

export async function getSectorQuotes(MarketQuote) {
  if (!process.env.FINNHUB_API_KEY) {
    return { quotes: [], lastUpdated: null, configured: false };
  }
  const result = await getQuotesForSymbols(MarketQuote, TRACKED_SECTORS);
  return { ...result, configured: true };
}

// symbols: array of uppercase ticker strings (already validated/deduped by
// the caller — see api/users/watchlist/route.js). displayName is just the
// ticker itself since arbitrary symbols don't have a friendly name on hand
// without an extra provider lookup.
export async function getWatchlistQuotes(MarketQuote, symbols) {
  if (!process.env.FINNHUB_API_KEY) {
    return { quotes: [], lastUpdated: null, configured: false };
  }
  const descriptors = symbols.map((symbol, i) => ({
    symbol,
    displayName: symbol,
    sortOrder: i,
  }));
  const result = await getQuotesForSymbols(MarketQuote, descriptors);
  return { ...result, configured: true };
}
