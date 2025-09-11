import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { Op } from "sequelize";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")) : null;

    const { ArticleLike, NewsArticle, JournalArticle, MarketArticle } = await initializeDbAndModels();

    const userLikes = await ArticleLike.findAll({
      where: { userId: session.user.id },
      order: [["createdAt", "DESC"]],
      limit: limit, 
    });

    if (userLikes.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    const likedUrls = userLikes.map(like => like.articleUrl);
    const likedOrderMap = new Map(userLikes.map((like, index) => [like.articleUrl, index]));

    const [newsArticles, journalArticles, marketArticles] = await Promise.all([
      NewsArticle.findAll({ where: { url: { [Op.in]: likedUrls } } }),
      JournalArticle.findAll({ where: { url: { [Op.in]: likedUrls } } }),
      MarketArticle.findAll({ where: { url: { [Op.in]: likedUrls } } }),
    ]);
    
    const combinedArticles = [...newsArticles, ...journalArticles, ...marketArticles];

    const sortedArticles = combinedArticles.sort((a, b) => {
        return likedOrderMap.get(a.url) - likedOrderMap.get(b.url);
    });

    const articlesWithLikeStatus = sortedArticles.map(article => ({
        ...article.toJSON(),
        isLikedByUser: true, 
    }));

    return NextResponse.json({ articles: articlesWithLikeStatus });
  } catch (err) {
    console.error("Error fetching liked articles:", err);
    return NextResponse.json({ error: "Could not fetch articles" }, { status: 500 });
  }
}