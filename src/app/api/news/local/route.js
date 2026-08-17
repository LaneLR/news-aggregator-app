import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLocalArticles } from "@/lib/localArticles";
import { resolveHubCity } from "@/lib/resolveHubCity";

// Enough for a single carousel row without over-fetching — the full,
// paginated "local" list lives behind /api/articles/local instead. Mirrors
// /api/news/today/route.js.
const PREVIEW_LIMIT = 12;

// Unlike category pages, "Local" has no anonymous-teaser mode — its home
// (/news) already redirects signed-out visitors, so this requires a real
// session rather than degrading gracefully.
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

  const isSubscribed = !!(session.user.tier && session.user.tier !== "Free");

  try {
    const { articles } = await getLocalArticles({
      hubCityId: hub.id,
      sort: "newest",
      userId: session.user.id,
      page: 1,
      limit: PREVIEW_LIMIT,
      isSubscribed,
    });

    return NextResponse.json({ articles, hubCity: hub });
  } catch (err) {
    console.error("Error fetching local articles:", err);
    return NextResponse.json(
      { error: "Could not fetch local articles" },
      { status: 500 }
    );
  }
}
