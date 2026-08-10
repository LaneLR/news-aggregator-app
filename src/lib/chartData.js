// Historical price chart data via Yahoo Finance's chart endpoint. There's
// no official public API for this — it's undocumented and carries no
// stability guarantee, but it's the only free source (with or without a
// key) that actually has multi-year daily/weekly history; Finnhub's free
// tier returned "no access" when tested against this app's own key for the
// equivalent endpoint. Cached server-side per (symbol, range) so this
// endpoint is hit at most once per range's refresh interval, shared across
// every visitor — not once per page view.
const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Interval choice per range mirrors what Yahoo itself actually has data
// for: fine 5m/15m bars only exist for roughly the last 60 days, so 1D/5D
// use those; everything older falls back to daily/weekly/monthly bars,
// which is the resolution Yahoo has for multi-year history anyway.
export const CHART_RANGES = {
  "1d": { interval: "5m", ttlMs: 15 * MINUTE, label: "1D" },
  "5d": { interval: "15m", ttlMs: 15 * MINUTE, label: "5D" },
  "1mo": { interval: "1d", ttlMs: 1 * HOUR, label: "1M" },
  "3mo": { interval: "1d", ttlMs: 4 * HOUR, label: "3M" },
  "6mo": { interval: "1d", ttlMs: 4 * HOUR, label: "6M" },
  "1y": { interval: "1d", ttlMs: 12 * HOUR, label: "1Y" },
  "5y": { interval: "1wk", ttlMs: 1 * DAY, label: "5Y" },
  "10y": { interval: "1wk", ttlMs: 1 * DAY, label: "10Y" },
  max: { interval: "1mo", ttlMs: 1 * DAY, label: "Max" },
};

async function fetchYahooChart(symbol, range) {
  const { interval } = CHART_RANGES[range];
  const url = `${YAHOO_CHART_BASE}/${symbol}?range=${range}&interval=${interval}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Yahoo chart request failed for ${symbol}/${range}: ${res.status}`);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (data?.chart?.error || !result) {
      throw new Error(`Yahoo chart returned no data for ${symbol}/${range}`);
    }

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    return timestamps
      .map((t, i) => (typeof closes[i] === "number" ? { t: new Date(t * 1000).toISOString(), price: closes[i] } : null))
      .filter(Boolean);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Lazily-refreshed per (symbol, range): serves the cached row if it's
// still within that range's TTL, otherwise fetches fresh from Yahoo and
// updates the cache. Falls back to whatever's cached (even if stale) if
// the fetch itself fails, rather than showing a blank chart.
export async function getChartRange(MarketChartCache, symbol, range) {
  if (!CHART_RANGES[range]) {
    throw new Error(`Unknown chart range: ${range}`);
  }

  const { ttlMs } = CHART_RANGES[range];
  const cached = await MarketChartCache.findOne({ where: { symbol, rangeKey: range } });
  const isStale = !cached || Date.now() - new Date(cached.updatedAt).getTime() > ttlMs;

  if (!isStale) {
    return { points: cached.points, updatedAt: cached.updatedAt.toISOString() };
  }

  try {
    const points = await fetchYahooChart(symbol, range);
    const [row] = await MarketChartCache.upsert({ symbol, rangeKey: range, points });
    return { points, updatedAt: row.updatedAt.toISOString() };
  } catch (err) {
    console.error(`Chart data refresh failed for ${symbol}/${range}:`, err);
    if (cached) return { points: cached.points, updatedAt: cached.updatedAt.toISOString() };
    return { points: [], updatedAt: null };
  }
}
