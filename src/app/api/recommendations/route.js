import { NextResponse } from "next/server";
import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { auth } from "@/lib/auth";
import { getRecommendedArticles } from "@/lib/recommendations";

const RESULT_LIMIT = 40;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.tier === "Free") {
    return NextResponse.json(
      { error: "This feature is for subscribers only." },
      { status: 403 }
    );
  }

  const userId = session.user.id;

  try {
    const db = await initializeDbAndModels();
    const { ArticleLike, ReadArticle } = db;

    const ranked = await getRecommendedArticles(db, userId, { limit: RESULT_LIMIT });

    const likes = await ArticleLike.findAll({ where: { userId }, attributes: ["articleUrl"] });
    const likedUrls = likes.map((l) => l.articleUrl);

    const rankedUrls = ranked.map((r) => r.article.url);
    const userReads = rankedUrls.length
      ? await ReadArticle.findAll({
          where: { userId, articleUrl: { [Op.in]: rankedUrls } },
          attributes: ["articleUrl"],
        })
      : [];
    const readUrls = new Set(userReads.map((read) => read.articleUrl));

    const likedUrlSet = new Set(likedUrls);
    const articles = ranked.map(({ article: a, reason }) => ({
      ...a.toJSON(),
      isLikedByUser: likedUrlSet.has(a.url),
      isRead: readUrls.has(a.url),
      recommendationReason: reason,
    }));

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("Error building recommendations:", err);
    return NextResponse.json(
      { error: "Could not build recommendations" },
      { status: 500 }
    );
  }
}
