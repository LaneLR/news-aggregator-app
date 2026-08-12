import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { excludeGatedCategoriesCondition, excludePremiumArticlesCondition } from "@/lib/subscriberOnlyCategories";
import { buildKeywordExclusion } from "@/lib/keywordFilter";
import { buildKeywordInclusion } from "@/lib/followedKeywords";

const RESULT_LIMIT = 40;
const LOOKBACK_DAYS = 30;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { User, Article, ReadArticle } = await initializeDbAndModels();
    const user = await User.findByPk(session.user.id, {
      attributes: ["mutedKeywords", "followedKeywords"],
    });

    const keywordInclusion = buildKeywordInclusion(user?.followedKeywords);
    if (!keywordInclusion) {
      return NextResponse.json({ articles: [], hasFollows: false });
    }

    const isSubscribed = session.user.tier && session.user.tier !== "Free";
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const whereConditions = [keywordInclusion, { publishedAt: { [Op.gte]: since } }];
    if (!isSubscribed) {
      whereConditions.push(excludeGatedCategoriesCondition());
      whereConditions.push(excludePremiumArticlesCondition());
    }
    const keywordExclusion = buildKeywordExclusion(user?.mutedKeywords);
    if (keywordExclusion) whereConditions.push(keywordExclusion);

    const [articles, userReads] = await Promise.all([
      Article.findAll({
        where: { [Op.and]: whereConditions },
        order: [["publishedAt", "DESC"]],
        limit: RESULT_LIMIT,
      }),
      ReadArticle.findAll({ where: { userId: session.user.id }, attributes: ["articleUrl"] }),
    ]);

    const readUrls = new Set(userReads.map((r) => r.articleUrl));
    const articlesWithStatus = articles.map((article) => ({
      ...article.toJSON(),
      isRead: readUrls.has(article.url),
    }));

    return NextResponse.json({ articles: articlesWithStatus, hasFollows: true });
  } catch (err) {
    console.error("Error fetching followed articles:", err);
    return NextResponse.json({ error: "Could not fetch articles" }, { status: 500 });
  }
}
