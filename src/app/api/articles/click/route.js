import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Best-effort view/click counter powering the "Trending" sort. Intentionally
// unauthenticated (anonymous visitors read articles too) and unrate-limited —
// it's a ranking signal, not a security- or billing-sensitive counter.
//
// When the click comes from a logged-in user, it also logs a UserInteraction
// row (sourceName/category denormalized from the client's article object) —
// that per-user click history is one of the signals the "For You" feed
// scores against.
export async function POST(req) {
  try {
    const { articleUrl, sourceName, category } = await req.json();
    if (!articleUrl) {
      return NextResponse.json(
        { error: "Article URL is required" },
        { status: 400 }
      );
    }

    const { Article, UserInteraction } = await initializeDbAndModels();
    await Article.increment("clickCount", { where: { url: articleUrl } });

    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await UserInteraction.create({
        userId: session.user.id,
        articleUrl,
        sourceName: sourceName || null,
        category: Array.isArray(category) ? category : null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error tracking article click:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
