// Publisher sources known to paywall their own articles at the source.
// Shared across article card components so the list only needs updating once.
//
// Match these against the literal `sourceName` values actually stored on
// Article rows, not each publisher's formal name — e.g. this app stores
// "New York Times" and "Washington Post" (no leading "The"), which a
// Set.has() exact-match silently never flags if it's stitched-together as
// "The New York Times"/"The Washington Post" instead. Verified against the
// live DB rather than assumed.
export const PAYWALLED_SOURCES = new Set([
  "Washington Post",
  "Financial Times",
  "The Wall Street Journal",
  "New York Times",
  "Bloomberg",
  "The Economist",
  "Reuters",
]);
