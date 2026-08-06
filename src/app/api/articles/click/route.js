import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";

// Best-effort view/click counter powering the "Trending" sort. Intentionally
// unauthenticated (anonymous visitors read articles too) and unrate-limited —
// it's a ranking signal, not a security- or billing-sensitive counter.
export async function POST(req) {
  try {
    const { articleUrl } = await req.json();
    if (!articleUrl) {
      return NextResponse.json(
        { error: "Article URL is required" },
        { status: 400 }
      );
    }

    const { Article } = await initializeDbAndModels();
    await Article.increment("clickCount", { where: { url: articleUrl } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error tracking article click:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
