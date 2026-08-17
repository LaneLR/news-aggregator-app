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
// survey-grade. Every entry below was confirmed via curl (real browser
// user-agent, following redirects, checking actual current headline text —
// not just HTTP 200 or structurally-valid XML) before being added; several
// candidates that looked identical in structure to working feeds turned out
// to be genuinely empty and were left out rather than guessed at.
//
// Some requested cities share a media market with an existing hub and were
// folded in rather than given a separate (unverifiable) feed of their own —
// noted inline where relevant.
export const HUB_CITIES = [
  // --- Original batch ---
  { id: "dallas-fort-worth", name: "Dallas-Fort Worth", state: "TX", lat: 32.85, lon: -97.05 },
  { id: "houston", name: "Houston", state: "TX", lat: 29.76, lon: -95.37 },
  { id: "chicago", name: "Chicago", state: "IL", lat: 41.88, lon: -87.63 },
  { id: "new-york", name: "New York", state: "NY", lat: 40.71, lon: -74.01 },
  { id: "atlanta", name: "Atlanta", state: "GA", lat: 33.75, lon: -84.39 },
  { id: "sacramento", name: "Sacramento", state: "CA", lat: 38.58, lon: -121.49 },
  { id: "bakersfield", name: "Bakersfield", state: "CA", lat: 35.37, lon: -119.02 },

  // --- Southwest / Texas / Mountain ---
  // Sedona -> phoenix, Santa Fe -> albuquerque, Las Cruces -> el-paso: same
  // TV market/stations, no separate feed needed.
  { id: "phoenix", name: "Phoenix", state: "AZ", lat: 33.4484, lon: -112.074 },
  { id: "tucson", name: "Tucson", state: "AZ", lat: 32.2226, lon: -110.9747 },
  { id: "albuquerque", name: "Albuquerque", state: "NM", lat: 35.0844, lon: -106.6504 },
  { id: "colorado-springs", name: "Colorado Springs", state: "CO", lat: 38.8339, lon: -104.8214 },
  { id: "glenwood-springs", name: "Glenwood Springs", state: "CO", lat: 39.5505, lon: -107.3248 },
  { id: "billings", name: "Billings", state: "MT", lat: 45.7833, lon: -108.5007 },
  { id: "butte", name: "Butte", state: "MT", lat: 46.0038, lon: -112.5348 },
  { id: "missoula", name: "Missoula", state: "MT", lat: 46.8721, lon: -113.994 },
  { id: "great-falls", name: "Great Falls", state: "MT", lat: 47.5053, lon: -111.3008 },
  { id: "austin", name: "Austin", state: "TX", lat: 30.2672, lon: -97.7431 },
  { id: "el-paso", name: "El Paso", state: "TX", lat: 31.7619, lon: -106.485 },
  { id: "lubbock", name: "Lubbock", state: "TX", lat: 33.5779, lon: -101.8552 },
  { id: "amarillo", name: "Amarillo", state: "TX", lat: 35.222, lon: -101.8313 },
  { id: "san-antonio", name: "San Antonio", state: "TX", lat: 29.4241, lon: -98.4936 },
  { id: "midland", name: "Midland-Odessa", state: "TX", lat: 31.9973, lon: -102.0779 },
  { id: "tyler", name: "Tyler", state: "TX", lat: 32.3513, lon: -95.3011 },
  { id: "waco", name: "Waco", state: "TX", lat: 31.5493, lon: -97.1467 },
  { id: "corpus-christi", name: "Corpus Christi", state: "TX", lat: 27.8006, lon: -97.3964 },
  { id: "brownsville", name: "Brownsville", state: "TX", lat: 25.9017, lon: -97.4975 },
  { id: "oklahoma-city", name: "Oklahoma City", state: "OK", lat: 35.4676, lon: -97.5164 },
  { id: "tulsa", name: "Tulsa", state: "OK", lat: 36.154, lon: -95.9928 },

  // --- Deep South ---
  // Tuscaloosa -> birmingham: no dedicated local feed found, nearest hub.
  { id: "new-orleans", name: "New Orleans", state: "LA", lat: 29.95, lon: -90.07 },
  { id: "baton-rouge", name: "Baton Rouge", state: "LA", lat: 30.45, lon: -91.15 },
  { id: "shreveport", name: "Shreveport", state: "LA", lat: 32.53, lon: -93.75 },
  { id: "lafayette-la", name: "Lafayette", state: "LA", lat: 30.22, lon: -92.02 },
  { id: "jackson-ms", name: "Jackson", state: "MS", lat: 32.3, lon: -90.18 },
  { id: "biloxi", name: "Biloxi", state: "MS", lat: 30.4, lon: -88.89 },
  { id: "birmingham", name: "Birmingham", state: "AL", lat: 33.52, lon: -86.81 },
  { id: "montgomery-al", name: "Montgomery", state: "AL", lat: 32.37, lon: -86.3 },
  { id: "mobile", name: "Mobile", state: "AL", lat: 30.69, lon: -88.04 },
  { id: "tampa", name: "Tampa", state: "FL", lat: 27.95, lon: -82.46 },
  { id: "miami", name: "Miami", state: "FL", lat: 25.76, lon: -80.19 },
  { id: "orlando", name: "Orlando", state: "FL", lat: 28.54, lon: -81.38 },
  { id: "pensacola", name: "Pensacola", state: "FL", lat: 30.42, lon: -87.22 },
  { id: "tallahassee", name: "Tallahassee", state: "FL", lat: 30.44, lon: -84.28 },
  { id: "jacksonville", name: "Jacksonville", state: "FL", lat: 30.33, lon: -81.66 },
  { id: "savannah", name: "Savannah", state: "GA", lat: 32.08, lon: -81.09 },
  { id: "augusta", name: "Augusta", state: "GA", lat: 33.47, lon: -81.97 },
  { id: "charleston-sc", name: "Charleston", state: "SC", lat: 32.78, lon: -79.93 },
  { id: "greenville", name: "Greenville", state: "SC", lat: 34.85, lon: -82.4 },
  { id: "myrtle-beach", name: "Myrtle Beach", state: "SC", lat: 33.69, lon: -78.89 },
  { id: "charlotte", name: "Charlotte", state: "NC", lat: 35.23, lon: -80.84 },
  { id: "greensboro", name: "Greensboro", state: "NC", lat: 36.07, lon: -79.79 },
  { id: "raleigh", name: "Raleigh", state: "NC", lat: 35.78, lon: -78.64 },
  { id: "wilmington-nc", name: "Wilmington", state: "NC", lat: 34.23, lon: -77.94 },
  { id: "knoxville", name: "Knoxville", state: "TN", lat: 35.96, lon: -83.92 },
  { id: "nashville", name: "Nashville", state: "TN", lat: 36.16, lon: -86.78 },
  { id: "memphis", name: "Memphis", state: "TN", lat: 35.15, lon: -90.05 },
  { id: "chattanooga", name: "Chattanooga", state: "TN", lat: 35.05, lon: -85.31 },
  { id: "jackson-tn", name: "Jackson", state: "TN", lat: 35.61, lon: -88.81 },

  // --- Northeast ---
  // Newark/Jersey City/Paterson, NJ -> new-york: same media market.
  // Worcester, MA -> no dedicated feed found; nearest of boston/springfield-ma.
  { id: "pittsburgh", name: "Pittsburgh", state: "PA", lat: 40.44, lon: -79.99 },
  { id: "harrisburg", name: "Harrisburg", state: "PA", lat: 40.27, lon: -76.88 },
  { id: "albany", name: "Albany", state: "NY", lat: 42.65, lon: -73.75 },
  { id: "syracuse", name: "Syracuse", state: "NY", lat: 43.05, lon: -76.15 },
  { id: "watertown", name: "Watertown", state: "NY", lat: 43.97, lon: -75.91 },
  { id: "burlington", name: "Burlington", state: "VT", lat: 44.48, lon: -73.21 },
  { id: "new-haven", name: "New Haven", state: "CT", lat: 41.31, lon: -72.93 },
  { id: "hartford", name: "Hartford", state: "CT", lat: 41.76, lon: -72.69 },
  { id: "providence", name: "Providence", state: "RI", lat: 41.82, lon: -71.41 },
  { id: "springfield-ma", name: "Springfield", state: "MA", lat: 42.1, lon: -72.59 },
  { id: "manchester", name: "Manchester", state: "NH", lat: 42.99, lon: -71.46 },
  { id: "portland-me", name: "Portland", state: "ME", lat: 43.66, lon: -70.26 },
  { id: "bangor-me", name: "Bangor", state: "ME", lat: 44.8, lon: -68.77 },

  // --- West ---
  // Buffalo, WY -> casper; St George, UT and Twin Falls, ID: no working
  // feed found for either, left uncovered rather than guessed at.
  { id: "cheyenne", name: "Cheyenne", state: "WY", lat: 41.14, lon: -104.82 },
  { id: "casper", name: "Casper", state: "WY", lat: 42.87, lon: -106.31 },
  { id: "gillette", name: "Gillette", state: "WY", lat: 44.29, lon: -105.5 },
  { id: "jackson-wy", name: "Jackson", state: "WY", lat: 43.48, lon: -110.76 },
  { id: "los-angeles", name: "Los Angeles", state: "CA", lat: 34.05, lon: -118.24 },
  { id: "fresno", name: "Fresno", state: "CA", lat: 36.75, lon: -119.77 },
  { id: "san-francisco", name: "San Francisco", state: "CA", lat: 37.77, lon: -122.42 },
  { id: "redding", name: "Redding", state: "CA", lat: 40.59, lon: -122.39 },
  { id: "eureka", name: "Eureka", state: "CA", lat: 40.8, lon: -124.16 },
  { id: "reno", name: "Reno", state: "NV", lat: 39.53, lon: -119.81 },
  { id: "las-vegas", name: "Las Vegas", state: "NV", lat: 36.17, lon: -115.14 },
  { id: "salt-lake-city", name: "Salt Lake City", state: "UT", lat: 40.76, lon: -111.89 },
  { id: "seattle", name: "Seattle", state: "WA", lat: 47.61, lon: -122.33 },
  { id: "spokane", name: "Spokane", state: "WA", lat: 47.66, lon: -117.43 },
  { id: "portland-or", name: "Portland", state: "OR", lat: 45.52, lon: -122.68 },
  { id: "eugene", name: "Eugene", state: "OR", lat: 44.05, lon: -123.09 },
  { id: "bend", name: "Bend", state: "OR", lat: 44.06, lon: -121.31 },
  { id: "medford", name: "Medford", state: "OR", lat: 42.33, lon: -122.86 },
  { id: "boise", name: "Boise", state: "ID", lat: 43.62, lon: -116.2 },

  // --- Midwest East ---
  // Springfield, IL: no working feed found, left uncovered (Chicago is the
  // nearest existing hub by distance). Delaware has no full-power in-state
  // TV market (Wilmington sits in Philadelphia's DMA, Dover in Salisbury's)
  // — wilmington-de uses a genuine local news site rather than a TV
  // affiliate, and only covers Wilmington; Dover is left uncovered.
  { id: "indianapolis", name: "Indianapolis", state: "IN", lat: 39.77, lon: -86.16 },
  { id: "fort-wayne", name: "Fort Wayne", state: "IN", lat: 41.08, lon: -85.14 },
  { id: "bowling-green", name: "Bowling Green", state: "KY", lat: 36.99, lon: -86.44 },
  { id: "louisville", name: "Louisville", state: "KY", lat: 38.25, lon: -85.76 },
  { id: "lexington", name: "Lexington", state: "KY", lat: 38.04, lon: -84.5 },
  { id: "grand-rapids", name: "Grand Rapids", state: "MI", lat: 42.96, lon: -85.67 },
  { id: "detroit", name: "Detroit", state: "MI", lat: 42.33, lon: -83.05 },
  { id: "columbus", name: "Columbus", state: "OH", lat: 39.96, lon: -82.99 },
  { id: "cincinnati", name: "Cincinnati", state: "OH", lat: 39.1, lon: -84.51 },
  { id: "dayton", name: "Dayton", state: "OH", lat: 39.76, lon: -84.19 },
  { id: "cleveland", name: "Cleveland", state: "OH", lat: 41.5, lon: -81.69 },
  { id: "richmond", name: "Richmond", state: "VA", lat: 37.54, lon: -77.44 },
  { id: "norfolk", name: "Norfolk", state: "VA", lat: 36.85, lon: -76.29 },
  { id: "roanoke", name: "Roanoke", state: "VA", lat: 37.27, lon: -79.94 },
  { id: "charleston-huntington", name: "Charleston-Huntington", state: "WV", lat: 38.35, lon: -81.63 },
  { id: "wilmington-de", name: "Wilmington", state: "DE", lat: 39.74, lon: -75.55 },
  { id: "baltimore", name: "Baltimore", state: "MD", lat: 39.29, lon: -76.61 },
  { id: "washington-dc", name: "Washington", state: "DC", lat: 38.9, lon: -77.04 },

  // --- Central / Midwest ---
  // Hays, KS and Jonesboro, AR: no working feed found, left uncovered.
  { id: "wichita", name: "Wichita", state: "KS", lat: 37.6872, lon: -97.3301 },
  { id: "topeka", name: "Topeka", state: "KS", lat: 39.0473, lon: -95.6752 },
  { id: "lincoln", name: "Lincoln", state: "NE", lat: 40.8136, lon: -96.7026 },
  { id: "omaha", name: "Omaha", state: "NE", lat: 41.2565, lon: -95.9345 },
  { id: "sioux-falls", name: "Sioux Falls", state: "SD", lat: 43.5446, lon: -96.7311 },
  { id: "rapid-city", name: "Rapid City", state: "SD", lat: 44.0805, lon: -103.231 },
  { id: "fargo", name: "Fargo", state: "ND", lat: 46.8772, lon: -96.7898 },
  { id: "bismarck", name: "Bismarck", state: "ND", lat: 46.8083, lon: -100.7837 },
  { id: "minneapolis", name: "Minneapolis", state: "MN", lat: 44.9778, lon: -93.265 },
  { id: "rochester", name: "Rochester", state: "MN", lat: 44.0121, lon: -92.4802 },
  { id: "milwaukee", name: "Milwaukee", state: "WI", lat: 43.0389, lon: -87.9065 },
  { id: "madison", name: "Madison", state: "WI", lat: 43.0731, lon: -89.4012 },
  { id: "des-moines", name: "Des Moines", state: "IA", lat: 41.5868, lon: -93.625 },
  { id: "cedar-rapids", name: "Cedar Rapids", state: "IA", lat: 41.9779, lon: -91.6656 },
  { id: "columbia-mo", name: "Columbia", state: "MO", lat: 38.9517, lon: -92.3341 },
  { id: "springfield-mo", name: "Springfield", state: "MO", lat: 37.209, lon: -93.2923 },
  { id: "joplin", name: "Joplin", state: "MO", lat: 37.0842, lon: -94.5133 },
  { id: "kansas-city", name: "Kansas City", state: "MO", lat: 39.0997, lon: -94.5786 },
  { id: "st-louis", name: "St. Louis", state: "MO", lat: 38.627, lon: -90.1994 },
  { id: "little-rock", name: "Little Rock", state: "AR", lat: 34.7465, lon: -92.2896 },
  { id: "fort-smith-fayetteville", name: "Fort Smith-Fayetteville", state: "AR", lat: 35.3859, lon: -94.3985 },
];
