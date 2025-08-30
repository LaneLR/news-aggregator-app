import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { Op } from "sequelize";

export async function GET(req, context) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.tier === "Free") {
    return NextResponse.json(
      { error: "This feature is for subscribers only." },
      { status: 403 }
    );
  }

  const { feedId } = context.params;
  const { Feed, NewsArticle, JournalArticle, MarketArticle } =
    await initializeDbAndModels();
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

    const [newsArticles, journalArticles, marketArticles] = await Promise.all([
      NewsArticle.findAll({
        where: whereClause,
        limit: 50,
        order: [["publishedAt", "DESC"]],
      }),
      JournalArticle.findAll({
        where: whereClause,
        limit: 50,
        order: [["publishedAt", "DESC"]],
      }),
      MarketArticle.findAll({
        where: whereClause,
        limit: 50,
        order: [["publishedAt", "DESC"]],
      }),
    ]);

    const combinedArticles = [
      ...newsArticles,
      ...journalArticles,
      ...marketArticles,
    ].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return NextResponse.json({ articles: combinedArticles.slice(0, 100) });
  } catch (err) {
    console.error("Error fetching articles for feed:", err);
    return NextResponse.json(
      { error: "Could not fetch articles" },
      { status: 500 }
    );
  }
}
