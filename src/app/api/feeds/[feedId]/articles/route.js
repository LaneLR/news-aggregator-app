import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { Op } from "sequelize";
import { buildKeywordExclusion } from "@/lib/keywordFilter";

export async function GET(req, context) {
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

  // params is a Promise in Next 16 App Router — must be awaited, otherwise
  // feedId is always undefined and this always 404s (real bug fixed here).
  const { feedId } = await context.params;
  const { Feed, Article } = await initializeDbAndModels();
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("q")?.trim() || "";
  const categoryParam = searchParams.get("category")?.trim() || "";

  try {
    const feed = await Feed.findOne({
      where: { id: feedId, userId: session.user.id },
    });

    if (!feed) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    const { sourceNames, categories } = feed;
    const filterConditions = [];

    const feedFilterConditions = [];
    if (sourceNames?.length > 0) {
      feedFilterConditions.push({ sourceName: { [Op.in]: sourceNames } });
    }
    if (categories?.length > 0) {
      feedFilterConditions.push({ category: { [Op.overlap]: categories } });
    }
    if (feedFilterConditions.length > 0) {
      filterConditions.push({ [Op.or]: feedFilterConditions });
    }

    const searchQueryConditions = [];
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      const queryParts = terms.map((term) => ({
        [Op.or]: [
          { title: { [Op.iLike]: `%${term}%` } },
          { sourceName: { [Op.iLike]: `%${term}%` } },
        ],
      }));
      searchQueryConditions.push({ [Op.and]: queryParts });
    }

    if (categoryParam) {
      searchQueryConditions.push({
        category: {
          [Op.iLike]: `%${categoryParam}%`,
        },
      });
    }

    const { User } = await initializeDbAndModels();
    const currentUser = await User.findByPk(session.user.id, {
      attributes: ["mutedKeywords"],
    });
    const keywordExclusion = buildKeywordExclusion(currentUser?.mutedKeywords);
    if (keywordExclusion) filterConditions.push(keywordExclusion);

    const whereClause = {};
    if (filterConditions.length > 0) {
      whereClause[Op.and] = filterConditions;
    }
    if (searchQueryConditions.length > 0) {
      if (!whereClause[Op.and]) {
        whereClause[Op.and] = [];
      }
      whereClause[Op.and].push({ [Op.and]: searchQueryConditions });
    }

    if (
      feedFilterConditions.length === 0 &&
      searchQueryConditions.length === 0
    ) {
      return NextResponse.json({ articles: [] });
    }

    const combinedArticles = await Article.findAll({
      where: whereClause,
      limit: 100,
      order: [["publishedAt", "DESC"]],
    });

    if (session?.user?.id) {
      const { ArticleLike, ReadArticle } = await initializeDbAndModels();
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
      const likedUrls = new Set(userLikes.map((like) => like.articleUrl));
      const readUrls = new Set(userReads.map((read) => read.articleUrl));

      const articlesWithLikes = combinedArticles.map((article) => ({
        ...article.toJSON(),
        isLikedByUser: likedUrls.has(article.url),
        isRead: readUrls.has(article.url),
      }));

      return NextResponse.json({ articles: articlesWithLikes });
    }

    return NextResponse.json({ articles: combinedArticles });
  } catch (err) {
    console.error("Error fetching articles for feed:", err);
    return NextResponse.json(
      { error: "Could not fetch articles" },
      { status: 500 }
    );
  }
}
