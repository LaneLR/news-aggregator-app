import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { Op } from "sequelize";
import { excludeGatedCategoriesCondition } from "@/lib/subscriberOnlyCategories";
import { buildKeywordExclusion } from "@/lib/keywordFilter";

const CATEGORIES_TO_DISPLAY = [
  "Business",
  "Tech",
  "Entertainment",
  "Sports",
  "Science",
];

export async function GET(req) {
  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  try {
    const { Article, ArticleLike, ReadArticle, User } = await initializeDbAndModels();

    // Market/Finance/Journal content is subscriber-only — exclude it from
    // the general home feed for everyone else, otherwise gated content
    // would leak into "Top Stories" regardless of subscription status.
    const visibilityConditions = isSubscribed
      ? []
      : [excludeGatedCategoriesCondition()];

    if (session?.user?.id) {
      const currentUser = await User.findByPk(session.user.id, {
        attributes: ["mutedKeywords"],
      });
      const keywordExclusion = buildKeywordExclusion(currentUser?.mutedKeywords);
      if (keywordExclusion) visibilityConditions.push(keywordExclusion);
    }

    // Fetch latest articles for each specific category
    const categoryResults = await Promise.all(
      CATEGORIES_TO_DISPLAY.map(async (category) => ({
        category,
        articles: await Article.findAll({
          where: {
            [Op.and]: [
              ...visibilityConditions,
              { category: { [Op.contains]: [category] } },
            ],
          },
          limit: 10,
          order: [["publishedAt", "DESC"]],
        }),
      }))
    );

    // Combine everything into a structured object — every category in
    // CATEGORIES_TO_DISPLAY gets a key even when empty (`[]`), not just the
    // ones with current articles. NewNewsPage renders one section per key
    // it receives; dropping empty categories here would make their whole
    // section (title included, not just the article row) disappear the
    // moment real data replaces the loading skeleton, instead of just
    // showing "nothing new" inside a section that's still there.
    const categorizedArticles = {};
    categoryResults.forEach((result) => {
      categorizedArticles[result.category] = result.articles;
    });

    // 4. Add user-specific "liked"/"read" status to all articles
    if (session?.user?.id) {
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

      for (const category in categorizedArticles) {
        categorizedArticles[category] = categorizedArticles[category].map(
          (article) => ({
            ...article.toJSON(),
            isLikedByUser: likedUrls.has(article.url),
            isRead: readUrls.has(article.url),
          })
        );
      }
    }

    return NextResponse.json(categorizedArticles);
  } catch (err) {
    console.error("Error fetching categorized news:", err);
    return NextResponse.json(
      { error: "Could not fetch news" },
      { status: 500 }
    );
  }
}
