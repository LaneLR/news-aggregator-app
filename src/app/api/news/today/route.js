import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodayArticles } from "@/lib/todayArticles";

// Enough for a single carousel row without over-fetching — the full,
// paginated "today" list lives behind /api/articles/today instead.
const PREVIEW_LIMIT = 12;

// Unlike category pages, "Today" has no anonymous-teaser mode — its home
// (/news) already redirects signed-out visitors, so this requires a real
// session rather than degrading gracefully.
export async function GET(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startOfDay = searchParams.get("startOfDay");
  if (!startOfDay) {
    return NextResponse.json({ error: "startOfDay is required" }, { status: 400 });
  }

  const isSubscribed = !!(session.user.tier && session.user.tier !== "Free");

  try {
    const { articles } = await getTodayArticles({
      startOfDay,
      sort: "newest",
      userId: session.user.id,
      page: 1,
      limit: PREVIEW_LIMIT,
      isSubscribed,
    });

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("Error fetching today's articles:", err);
    return NextResponse.json(
      { error: "Could not fetch today's articles" },
      { status: 500 }
    );
  }
}
