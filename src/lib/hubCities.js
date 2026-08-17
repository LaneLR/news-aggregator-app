// Local News' coverage universe: metro areas with a verified, working local
// RSS feed wired into rss-fetch-app's feeds/localSources.json (see that
// file). Deliberately not every US city over ~100k population — a hub with
// no real feed behind it would just be a permanently-empty section, so this
// list and the verified-feed list stay 1:1. Expanding coverage means
// verifying a new local feed and adding matching entries to both files;
// resolveHubCity.js doesn't change either way.
//
// `id` must match the `hubCity` value rss-fetch-app stamps onto articles
// from that metro's feed. Coordinates are city-center, approximate —
// sufficient for "which hub is nearest" (haversineDistance.js), not
// survey-grade.
export const HUB_CITIES = [
  { id: "dallas-fort-worth", name: "Dallas-Fort Worth", state: "TX", lat: 32.85, lon: -97.05 },
  { id: "houston", name: "Houston", state: "TX", lat: 29.76, lon: -95.37 },
  { id: "chicago", name: "Chicago", state: "IL", lat: 41.88, lon: -87.63 },
  { id: "new-york", name: "New York", state: "NY", lat: 40.71, lon: -74.01 },
  { id: "atlanta", name: "Atlanta", state: "GA", lat: 33.75, lon: -84.39 },
  { id: "sacramento", name: "Sacramento", state: "CA", lat: 38.58, lon: -121.49 },
  { id: "bakersfield", name: "Bakersfield", state: "CA", lat: 35.37, lon: -119.02 },
];
