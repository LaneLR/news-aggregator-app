import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { auth } from "@/lib/auth";
import initializeDbAndModels from "@/lib/db";
import { excludeGatedCategoriesCondition } from "@/lib/subscriberOnlyCategories";
import { clusterArticles } from "@/lib/storyClustering";

const WINDOW_HOURS = 48;
const CANDIDATE_LIMIT = 300;
const MAX_STORIES = 8;

export async function GET() {
  const session = await auth();
  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";

  try {
    const { Article } = await initializeDbAndModels();
    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);

    const conditions = [{ publishedAt: { [Op.gte]: since } }];
    if (!isSubscribed) conditions.push(excludeGatedCategoriesCondition());

    const articles = await Article.findAll({
      where: { [Op.and]: conditions },
      order: [["publishedAt", "DESC"]],
      limit: CANDIDATE_LIMIT,
    });

    const clusters = clusterArticles(
      articles.map((a) => a.toJSON()),
      { maxClusters: MAX_STORIES }
    );

    const topStories = clusters.map((group) => ({
      lead: group[0],
      relatedCount: group.length - 1,
      sources: [...new Set(group.map((a) => a.sourceName).filter(Boolean))],
    }));

    return NextResponse.json({ topStories });
  } catch (err) {
    console.error("Error building top stories:", err);
    return NextResponse.json({ error: "Could not fetch top stories" }, { status: 500 });
  }
}
