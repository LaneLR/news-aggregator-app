import { NextResponse } from "next/server";

// Same "configured: false" convention as marketData.js's FINNHUB_API_KEY
// checks — lets the widget show "not set up yet" instead of a raw error
// when OPENWEATHER_API_KEY is missing, and starts working the moment a key
// is added with no code change.
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
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
      query
    )}&limit=5&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ results: [], configured: true }, { status: 502 });
    }
    const data = await res.json();

    const results = (Array.isArray(data) ? data : []).map((loc) => ({
      name: loc.name,
      state: loc.state || null,
      country: loc.country || null,
      lat: loc.lat,
      lon: loc.lon,
    }));

    return NextResponse.json({ results, configured: true });
  } catch (err) {
    console.error("Weather location search failed:", err);
    return NextResponse.json({ results: [], configured: true }, { status: 500 });
  }
}
