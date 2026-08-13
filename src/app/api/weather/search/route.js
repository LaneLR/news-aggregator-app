import { NextResponse } from "next/server";

// A bare 5-digit (optionally ZIP+4) numeric query is treated as a US zip
// code rather than a city name — OpenWeather's city-search endpoint
// (/geo/1.0/direct) doesn't accept zip codes at all, it needs the separate
// /geo/1.0/zip endpoint. US-only (no country picker in the UI), matching
// what was actually asked for; a non-US postal code just falls through to
// the normal city-name search and (correctly) finds nothing.
const US_ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

async function searchByZip(zip, apiKey) {
  const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(
    zip.slice(0, 5)
  )},US&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return []; // includes 404 "not found" for a nonexistent zip
  const data = await res.json();
  return [{ name: data.name, state: null, country: data.country || "US", lat: data.lat, lon: data.lon }];
}

// Returns null (rather than throwing) on a non-ok upstream response, so the
// caller can still distinguish "upstream errored" (502) from "unexpected
// exception" (500) — same distinction the route made before zip support was
// added.
async function searchByName(query, apiKey) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    query
  )}&limit=5&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((loc) => ({
    name: loc.name,
    state: loc.state || null,
    country: loc.country || null,
    lat: loc.lat,
    lon: loc.lon,
  }));
}

export async function GET(req) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: [], configured: false });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim().slice(0, 100) || "";
  if (query.length < 2) {
    return NextResponse.json({ results: [], configured: true });
  }

  try {
    if (US_ZIP_PATTERN.test(query)) {
      const results = await searchByZip(query, apiKey);
      return NextResponse.json({ results, configured: true });
    }

    const results = await searchByName(query, apiKey);
    if (results === null) {
      return NextResponse.json({ results: [], configured: true }, { status: 502 });
    }
    return NextResponse.json({ results, configured: true });
  } catch (err) {
    console.error("Weather location search failed:", err);
    return NextResponse.json({ results: [], configured: true }, { status: 500 });
  }
}
