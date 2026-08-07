import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { Sequelize } from "sequelize";

export async function POST(req) {
  const session = await auth();
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

    const { sequelize, ArticleLike, Article } = await initializeDbAndModels();
    const userId = session.user.id;

    const updateLikeCount = async (increment, transaction) => {
      const operator = increment
        ? Sequelize.literal('"likeCount" + 1')
        : Sequelize.literal('"likeCount" - 1');
      await Article.update(
        { likeCount: operator },
        { where: { url: articleUrl }, transaction }
      );
    };

    const liked = await sequelize.transaction(async (transaction) => {
      // Locking the row (or its absence) for the duration of the transaction
      // prevents a rapid double-click from racing past this check twice.
      const existingLike = await ArticleLike.findOne({
        where: { userId, articleUrl },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existingLike) {
        await existingLike.destroy({ transaction });
        await updateLikeCount(false, transaction); // Decrement
        return false;
      }

      await ArticleLike.create({ userId, articleUrl }, { transaction });
      await updateLikeCount(true, transaction); // Increment
      return true;
    });

    return NextResponse.json({
      success: true,
      liked,
      message: liked ? "Article liked." : "Article unliked.",
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      // Lost a race to another concurrent request for the same like — the
      // article is already in the desired "liked" state, so treat as a no-op.
      return NextResponse.json({
        success: true,
        liked: true,
        message: "Article liked.",
      });
    }
    console.error("Error liking article:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
