import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLocalArticles } from "@/lib/localArticles";
import { resolveHubCity } from "@/lib/resolveHubCity";

// Backs the dedicated, paginated "Local News" page — see
// /api/news/local/route.js for the home page's smaller preview carousel,
// which shares getLocalArticles but not this route. Takes the same lat/lon
// shape either way (from geolocation or a manually-searched city/zip — see
// LocationPicker.jsx) rather than a separate hub-city-id path, since both
// acquisition methods already resolve down to one lat/lon.
export async function GET(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lon = parseFloat(searchParams.get("lon"));
  const hub = resolveHubCity({ lat, lon });
  if (!hub) {
    return NextResponse.json({ error: "No location provided" }, { status: 400 });
  }

  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const sort = searchParams.get("sort") || "newest";
  const isSubscribed = !!(session.user.tier && session.user.tier !== "Free");

  try {
    const data = await getLocalArticles({
      hubCityId: hub.id,
      sort,
      userId: session.user.id,
      page,
      isSubscribed,
    });

    return NextResponse.json({ ...data, hubCity: hub });
  } catch (err) {
    console.error("Failed to fetch local articles:", err);

    return NextResponse.json(
      { error: "Failed to fetch content from the database." },
      { status: 500 }
    );
  }
}
