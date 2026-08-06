import { NextResponse } from "next/server";
import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const RESULT_LIMIT = 40;
const MIN_RESULTS_BEFORE_BACKFILL = 24;
const CANDIDATE_POOL_LIMIT = 200;
const MAX_RECENT_CLICKS = 200;
const TOP_SIGNALS = 8;

// Content-based "For You" ranking: builds a per-user affinity profile from
// likes (weight 3), saved articles (weight 5), and recent clicks (weight 1),
// then scores unseen articles by how much their source/category overlaps
// that profile, plus small recency/popularity tie-breakers. Falls back to
// trending for brand-new users with no signal yet.
async function fetchTrending(Article, limit, excludeUrls) {
  const where = {};
  if (excludeUrls.length) where.url = { [Op.notIn]: excludeUrls };
  return Article.findAll({
    where,
    order: [
      ["clickCount", "DESC"],
      ["likeCount", "DESC"],
    ],
    limit,
  });
}

export async function GET() {
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

  const userId = session.user.id;

  try {
    const { Article, ArticleLike, SavedArticle, Archive, UserInteraction } =
      await initializeDbAndModels();

    const [likes, userArchives, interactions] = await Promise.all([
      ArticleLike.findAll({ where: { userId }, attributes: ["articleUrl"] }),
      Archive.findAll({ where: { userId }, attributes: ["id"] }),
      UserInteraction.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: MAX_RECENT_CLICKS,
        attributes: ["articleUrl", "sourceName", "category"],
      }),
    ]);

    const likedUrls = likes.map((l) => l.articleUrl);
    const archiveIds = userArchives.map((a) => a.id);

    const [likedArticles, savedArticles] = await Promise.all([
      likedUrls.length
        ? Article.findAll({
            where: { url: { [Op.in]: likedUrls } },
            attributes: ["url", "sourceName", "category"],
          })
        : [],
      archiveIds.length
        ? SavedArticle.findAll({
            where: { archiveId: { [Op.in]: archiveIds } },
            attributes: ["url", "sourceName"],
          })
        : [],
    ]);

    const sourceWeights = {};
    const categoryWeights = {};
    const addSignal = (sourceName, category, weight) => {
      if (sourceName)
        sourceWeights[sourceName] = (sourceWeights[sourceName] || 0) + weight;
      if (Array.isArray(category)) {
        category.forEach((c) => {
          categoryWeights[c] = (categoryWeights[c] || 0) + weight;
        });
      }
    };
    likedArticles.forEach((a) => addSignal(a.sourceName, a.category, 3));
    savedArticles.forEach((a) => addSignal(a.sourceName, null, 5));
    interactions.forEach((i) => addSignal(i.sourceName, i.category, 1));

    const excludedUrls = Array.from(
      new Set([
        ...likedUrls,
        ...savedArticles.map((a) => a.url),
        ...interactions.map((i) => i.articleUrl),
      ])
    );

    const hasSignal =
      Object.keys(sourceWeights).length > 0 ||
      Object.keys(categoryWeights).length > 0;

    let ranked;
    if (!hasSignal) {
      ranked = await fetchTrending(Article, RESULT_LIMIT, excludedUrls);
    } else {
      const topSources = Object.entries(sourceWeights)
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_SIGNALS)
        .map(([name]) => name);
      const topCategories = Object.entries(categoryWeights)
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_SIGNALS)
        .map(([name]) => name);

      const orConditions = [];
      if (topSources.length) orConditions.push({ sourceName: { [Op.in]: topSources } });
      if (topCategories.length)
        orConditions.push({ category: { [Op.overlap]: topCategories } });

      const candidateWhere = { [Op.or]: orConditions };
      if (excludedUrls.length) candidateWhere.url = { [Op.notIn]: excludedUrls };

      const candidates = await Article.findAll({
        where: candidateWhere,
        order: [["publishedAt", "DESC"]],
        limit: CANDIDATE_POOL_LIMIT,
      });

      const now = Date.now();
      const scored = candidates.map((article) => {
        let score = sourceWeights[article.sourceName] || 0;
        if (Array.isArray(article.category)) {
          article.category.forEach((c) => {
            score += categoryWeights[c] || 0;
          });
        }
        const publishedAt = article.publishedAt || article.createdAt;
        const daysOld = (now - new Date(publishedAt).getTime()) / 86400000;
        const recencyBoost = Math.max(0, 3 - daysOld * 0.15);
        const popularityBoost = Math.log10(
          (article.clickCount || 0) + (article.likeCount || 0) + 1
        );
        return { article, score: score + recencyBoost + popularityBoost };
      });
      scored.sort((a, b) => b.score - a.score);
      ranked = scored.slice(0, RESULT_LIMIT).map((s) => s.article);

      if (ranked.length < MIN_RESULTS_BEFORE_BACKFILL) {
        const backfillExclude = [...excludedUrls, ...ranked.map((a) => a.url)];
        const backfill = await fetchTrending(
          Article,
          MIN_RESULTS_BEFORE_BACKFILL - ranked.length,
          backfillExclude
        );
        ranked = [...ranked, ...backfill];
      }
    }

    const likedUrlSet = new Set(likedUrls);
    const articles = ranked.map((a) => ({
      ...a.toJSON(),
      isLikedByUser: likedUrlSet.has(a.url),
    }));

    return NextResponse.json({ articles });
  } catch (err) {
    console.error("Error building recommendations:", err);
    return NextResponse.json(
      { error: "Could not build recommendations" },
      { status: 500 }
    );
  }
}
