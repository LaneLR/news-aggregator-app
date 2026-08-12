import { NextResponse } from "next/server";
import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { auth } from "@/lib/auth";
import { excludeGatedCategoriesCondition, excludePremiumArticlesCondition } from "@/lib/subscriberOnlyCategories";

// "liked" = highest likeCount, "trending" = highest clickCount (reads), both
// scoped to a recent window so old viral articles don't dominate forever.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "liked" ? "likeCount" : "clickCount";
  const days = Math.min(30, Math.max(1, parseInt(searchParams.get("days"), 10) || 7));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit"), 10) || 12));

  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  try {
    const { Article } = await initializeDbAndModels();

    const since = new Date();
    since.setDate(since.getDate() - days);

    const conditions = [
      { publishedAt: { [Op.gte]: since } },
      { [sort]: { [Op.gt]: 0 } },
    ];
    if (!isSubscribed) {
      conditions.push(excludeGatedCategoriesCondition());
      conditions.push(excludePremiumArticlesCondition());
    }
    const where = { [Op.and]: conditions };

    const articles = await Article.findAll({
      where,
      order: [[sort, "DESC"]],
      limit,
    });

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("Error fetching trending articles:", err);
    return NextResponse.json(
      { error: "Could not fetch trending articles" },
      { status: 500 }
    );
  }
}
