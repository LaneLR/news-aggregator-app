import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { excludeGatedCategoriesCondition, excludePremiumArticlesCondition } from "@/lib/subscriberOnlyCategories";
import { buildKeywordExclusion } from "@/lib/keywordFilter";
import { buildKeywordInclusion } from "@/lib/followedKeywords";
import { orderByDesc } from "@/lib/dbOrder";

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
      attributes: ["mutedKeywords", "followedKeywords", "followedSources"],
    });

    const keywordInclusion = buildKeywordInclusion(user?.followedKeywords);
    const sourceInclusion = user?.followedSources?.length
      ? { sourceName: { [Op.in]: user.followedSources } }
      : null;
    if (!keywordInclusion && !sourceInclusion) {
      return NextResponse.json({ articles: [], hasFollows: false });
    }
    const followInclusion =
      keywordInclusion && sourceInclusion
        ? { [Op.or]: [keywordInclusion, sourceInclusion] }
        : keywordInclusion || sourceInclusion;

    const isSubscribed = session.user.tier && session.user.tier !== "Free";
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const whereConditions = [followInclusion, { publishedAt: { [Op.gte]: since } }];
    if (!isSubscribed) {
      whereConditions.push(excludeGatedCategoriesCondition());
      whereConditions.push(excludePremiumArticlesCondition());
    }
    const keywordExclusion = buildKeywordExclusion(user?.mutedKeywords);
    if (keywordExclusion) whereConditions.push(keywordExclusion);

    const [articles, userReads] = await Promise.all([
      Article.findAll({
        where: { [Op.and]: whereConditions },
        order: [orderByDesc(Article, "publishedAt")],
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
