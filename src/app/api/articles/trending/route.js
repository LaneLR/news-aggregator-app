import { NextResponse } from "next/server";
import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SUBSCRIBER_ONLY_CATEGORIES } from "@/lib/subscriberOnlyCategories";

const GATED_TAGS = [...SUBSCRIBER_ONLY_CATEGORIES].map(
  (slug) => slug.charAt(0).toUpperCase() + slug.slice(1)
);

// "liked" = highest likeCount, "trending" = highest clickCount (reads), both
// scoped to a recent window so old viral articles don't dominate forever.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") === "liked" ? "likeCount" : "clickCount";
  const days = Math.min(30, Math.max(1, parseInt(searchParams.get("days"), 10) || 7));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit"), 10) || 12));

  const session = await getServerSession(authOptions);
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  try {
    const { Article } = await initializeDbAndModels();

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where = {
      publishedAt: { [Op.gte]: since },
      [sort]: { [Op.gt]: 0 },
    };
    if (!isSubscribed) {
      where.category = { [Op.not]: { [Op.overlap]: GATED_TAGS } };
    }

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
