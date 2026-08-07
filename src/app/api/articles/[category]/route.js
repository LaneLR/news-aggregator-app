import initializeDbAndModels from "@/lib/db";
import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { auth } from "@/lib/auth";
import { SUBSCRIBER_ONLY_CATEGORIES } from "@/lib/subscriberOnlyCategories";
import { buildKeywordExclusion } from "@/lib/keywordFilter";

export async function GET(req, { params }) {
  const { category } = await params;
  const session = await auth();

  // Market/Finance/Journal are subscriber-only. This mirrors the page-level
  // redirect in src/app/category/{market,finance,journal}/page.js, but has
  // to be enforced here too — otherwise the paywall is just a UI redirect
  // that anyone can bypass by calling this endpoint directly.
  if (SUBSCRIBER_ONLY_CATEGORIES.has(category.toLowerCase())) {
    if (!session || session.user.tier === "Free") {
      return NextResponse.json(
        { error: "This content is for subscribers only." },
        { status: 403 }
      );
    }
  }

  const { Article, ArticleLike, ReadArticle, User } = await initializeDbAndModels();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const sortParam = searchParams.get("sort");
  const sortColumn =
    sortParam === "liked"
      ? "likeCount"
      : sortParam === "trending"
      ? "clickCount"
      : "publishedAt";

  // Prepare the category name for the query.
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  try {
    const whereConditions = [{ category: { [Op.contains]: [categoryName] } }];

    let likedUrls = new Set();
    let readUrls = new Set();
    if (session?.user?.id) {
      const currentUser = await User.findByPk(session.user.id, {
        attributes: ["mutedKeywords"],
      });
      const keywordExclusion = buildKeywordExclusion(currentUser?.mutedKeywords);
      if (keywordExclusion) whereConditions.push(keywordExclusion);

      const [userLikes, userReads] = await Promise.all([
        ArticleLike.findAll({
          where: { userId: session.user.id },
          attributes: ["articleUrl"],
        }),
        ReadArticle.findAll({
          where: { userId: session.user.id },
          attributes: ["articleUrl"],
        }),
      ]);
      likedUrls = new Set(userLikes.map((like) => like.articleUrl));
      readUrls = new Set(userReads.map((read) => read.articleUrl));
    }

    const { rows, count } = await Article.findAndCountAll({
      where: { [Op.and]: whereConditions },
      order: [[sortColumn, "DESC"]],
      limit,
      offset,
    });

    return NextResponse.json({
      articles: rows.map((item) => ({
        ...item.toJSON(),
        isLikedByUser: likedUrls.has(item.url),
        isRead: readUrls.has(item.url),
      })),
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error(
      `Failed to fetch content for category "${categoryName}":`,
      err
    );

    return NextResponse.json(
      { error: "Failed to fetch content from the database." },
      { status: 500 }
    );
  }
}
