import { NextResponse } from "next/server";

function isValidLatLon(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Current conditions only, by design — see the memory note this feature
// came from: no radar, no alerts, no forecast beyond "right now." Keeping
// this endpoint's shape narrow (a handful of fields) matches that scope
// rather than passing through OpenWeatherMap's full response.
export async function GET(req) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));
  if (!isValidLatLon(lat, lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ configured: true, error: "Upstream error" }, { status: 502 });
    }
    const data = await res.json();

    const nowUnix = Math.floor(Date.now() / 1000);
    const isDay =
      typeof data.sys?.sunrise === "number" && typeof data.sys?.sunset === "number"
        ? nowUnix >= data.sys.sunrise && nowUnix < data.sys.sunset
        : true;

    return NextResponse.json({
      configured: true,
      tempF: Math.round(data.main?.temp),
      conditionId: data.weather?.[0]?.id ?? null,
      description: data.weather?.[0]?.description || null,
      isDay,
      locationName: data.name || null,
    });
  } catch (err) {
    console.error("Weather fetch failed:", err);
    return NextResponse.json({ configured: true, error: "Server error" }, { status: 500 });
  }
}
