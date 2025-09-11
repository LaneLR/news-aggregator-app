import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // <-- THIS IS THE FIX
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { Op } from "sequelize";

const CATEGORIES_TO_DISPLAY = [
  "Business",
  "Technology",
  "Entertainment",
  "Sports",
  "Science",
];

export async function GET(req) {
  const session = await getServerSession(authOptions);

  try {
    const { NewsArticle, JournalArticle, MarketArticle, ArticleLike } =
      await initializeDbAndModels();
    const models = [NewsArticle, JournalArticle, MarketArticle];

    // 1. Fetch the absolute latest articles for a "Top Stories" section
    const topStoriesPromises = models.map((model) =>
      model.findAll({ limit: 10, order: [["publishedAt", "DESC"]] })
    );
    const topStoriesResults = await Promise.all(topStoriesPromises);
    const topStories = topStoriesResults
      .flat()
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 10);

    // 2. Fetch latest articles for each specific category
    const categoryPromises = CATEGORIES_TO_DISPLAY.map((category) => {
      const promises = models.map((model) =>
        model.findAll({
          where: { category: { [Op.contains]: [category] } }, // Assuming category is an array
          limit: 10,
          order: [["publishedAt", "DESC"]],
        })
      );
      return Promise.all(promises).then((results) => ({
        category,
        articles: results
          .flat()
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
          .slice(0, 10),
      }));
    });

    const categoryResults = await Promise.all(categoryPromises);

    // 3. Combine everything into a structured object
    const categorizedArticles = {
      "Top Stories": topStories,
    };
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
