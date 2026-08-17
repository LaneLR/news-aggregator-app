import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodayArticles } from "@/lib/todayArticles";

// Backs the dedicated, paginated "Today" page — see
// /api/news/today/route.js for the home page's smaller preview carousel,
// which shares getTodayArticles but not this route.
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
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const sort = searchParams.get("sort") || "newest";
  const isSubscribed = !!(session.user.tier && session.user.tier !== "Free");

  try {
    const data = await getTodayArticles({
      startOfDay,
      sort,
      userId: session.user.id,
      page,
      isSubscribed,
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch today's articles:", err);

    return NextResponse.json(
      { error: "Failed to fetch content from the database." },
      { status: 500 }
    );
  }
}
