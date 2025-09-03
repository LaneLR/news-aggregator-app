import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import initializeDbAndModels from "@/lib/db";
import { Sequelize } from "sequelize";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { articleUrl } = await req.json();
    if (!articleUrl) {
      return NextResponse.json(
        { error: "Article URL is required" },
        { status: 400 }
      );
    }

    const { ArticleLike, NewsArticle, JournalArticle, MarketArticle } =
      await initializeDbAndModels();
    const userId = session.user.id;

    const existingLike = await ArticleLike.findOne({
      where: { userId, articleUrl },
    });

    // A helper function to update the like count on all article tables
    const updateLikeCount = async (increment) => {
      const operator = increment
        ? Sequelize.literal('"likeCount" + 1')
        : Sequelize.literal('"likeCount" - 1');
      await NewsArticle.update(
        { likeCount: operator },
        { where: { url: articleUrl } }
      );
      await JournalArticle.update(
        { likeCount: operator },
        { where: { url: articleUrl } }
      );
      await MarketArticle.update(
        { likeCount: operator },
        { where: { url: articleUrl } }
      );
    };

    if (existingLike) {
      // User is "unliking" the article
      await existingLike.destroy();
      await updateLikeCount(false); // Decrement
      return NextResponse.json({
        success: true,
        liked: false,
        message: "Article unliked.",
      });
    } else {
      // User is "liking" the article
      await ArticleLike.create({ userId, articleUrl });
      await updateLikeCount(true); // Increment
      return NextResponse.json({
        success: true,
        liked: true,
        message: "Article liked.",
      });
    }
  } catch (err) {
    console.error("Error liking article:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
