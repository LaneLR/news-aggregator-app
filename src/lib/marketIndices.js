// Split out from marketData.js so client components (MarketChart) can
// import the index list without pulling in marketData.js's `sequelize`
// import, which isn't browser-safe.
//
// Tracks the ETF that mirrors each index rather than the raw index itself.
// Raw index-level quotes are frequently licensed separately (and excluded
// from data providers' free tiers) even when delayed, while an ordinary
// ETF's price is regular market data available everywhere — these four are
// among the most liquid, tightest-tracking funds for their index, so the
// displayed price/change reads the same as the index for a glance-at-the-
// header snapshot, which is what this is for (not a trading terminal).
export const TRACKED_INDICES = [
  { symbol: "SPY", displayName: "S&P 500", sortOrder: 0 },
  { symbol: "DIA", displayName: "Dow Jones", sortOrder: 1 },
  { symbol: "QQQ", displayName: "Nasdaq 100", sortOrder: 2 },
  { symbol: "IWM", displayName: "Russell 2000", sortOrder: 3 },
];
