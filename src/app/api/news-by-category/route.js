import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { Op } from "sequelize";
import { SUBSCRIBER_ONLY_CATEGORIES } from "@/lib/subscriberOnlyCategories";

const CATEGORIES_TO_DISPLAY = [
  "Business",
  "Technology",
  "Entertainment",
  "Sports",
  "Science",
];

// Matches the capitalized category tags stored on articles (e.g. "Market"),
// derived from the lowercase slugs in SUBSCRIBER_ONLY_CATEGORIES.
const GATED_TAGS = [...SUBSCRIBER_ONLY_CATEGORIES].map(
  (slug) => slug.charAt(0).toUpperCase() + slug.slice(1)
);

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  try {
    const { Article, ArticleLike } = await initializeDbAndModels();

    // Market/Finance/Journal content is subscriber-only — exclude it from
    // the general home feed for everyone else, otherwise gated content
    // would leak into "Top Stories" regardless of subscription status.
    const visibilityConditions = isSubscribed
      ? []
      : [{ category: { [Op.not]: { [Op.overlap]: GATED_TAGS } } }];

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

    // Combine everything into a structured object
    const categorizedArticles = {};
    categoryResults.forEach((result) => {
      if (result.articles.length > 0) {
        categorizedArticles[result.category] = result.articles;
      }
    });

    // 4. Add user-specific "liked" status to all articles
    if (session?.user?.id) {
      const userLikes = await ArticleLike.findAll({
        where: { userId: session.user.id },
        attributes: ["articleUrl"],
      });
      const likedUrls = new Set(userLikes.map((like) => like.articleUrl));

      for (const category in categorizedArticles) {
        categorizedArticles[category] = categorizedArticles[category].map(
          (article) => ({
            ...article.toJSON(),
            isLikedByUser: likedUrls.has(article.url),
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
