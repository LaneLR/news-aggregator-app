import { NextResponse } from "next/server";
import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { auth } from "@/lib/auth";
import { buildKeywordExclusion } from "@/lib/keywordFilter";

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
async function fetchTrending(Article, limit, excludeUrls, keywordExclusion) {
  const where = {};
  if (excludeUrls.length) where.url = { [Op.notIn]: excludeUrls };
  if (keywordExclusion) where[Op.and] = [keywordExclusion];
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
  const session = await auth();
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
    const { Article, ArticleLike, ReadArticle, SavedArticle, Archive, UserInteraction, User } =
      await initializeDbAndModels();

    const [likes, userArchives, interactions, currentUser] = await Promise.all([
      ArticleLike.findAll({ where: { userId }, attributes: ["articleUrl"] }),
      Archive.findAll({ where: { userId }, attributes: ["id"] }),
      UserInteraction.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: MAX_RECENT_CLICKS,
        attributes: ["articleUrl", "sourceName", "category"],
      }),
      User.findByPk(userId, {
        attributes: ["mutedKeywords", "preferredCategories", "preferredSources"],
      }),
    ]);
    const keywordExclusion = buildKeywordExclusion(currentUser?.mutedKeywords);

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
    // Onboarding picks are a deliberate but lower-confidence signal than
    // actual engagement — weighted between a click and a like so a brand
    // new account isn't stuck on generic trending until it accumulates
    // real activity.
    (currentUser?.preferredSources || []).forEach((s) => addSignal(s, null, 2));
    (currentUser?.preferredCategories || []).forEach((c) => addSignal(null, [c], 2));

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
      const trending = await fetchTrending(Article, RESULT_LIMIT, excludedUrls, keywordExclusion);
      ranked = trending.map((article) => ({ article, reason: null }));
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

      const candidateAnd = [{ [Op.or]: orConditions }];
      if (keywordExclusion) candidateAnd.push(keywordExclusion);
      const candidateWhere = { [Op.and]: candidateAnd };
      if (excludedUrls.length) candidateWhere.url = { [Op.notIn]: excludedUrls };

      const candidates = await Article.findAll({
        where: candidateWhere,
        order: [["publishedAt", "DESC"]],
        limit: CANDIDATE_POOL_LIMIT,
      });

      const now = Date.now();
      const scored = candidates.map((article) => {
        // Tracks whichever single signal (a followed source, or a category
        // you engage with) contributed the most weight, so the UI can show
        // an honest "Because you..." reason instead of a black-box ranking.
        let score = 0;
        let reason = null;
        let reasonWeight = 0;

        const sourceScore = sourceWeights[article.sourceName] || 0;
        score += sourceScore;
        if (sourceScore > reasonWeight) {
          reasonWeight = sourceScore;
          reason = `Because you follow ${article.sourceName}`;
        }

        if (Array.isArray(article.category)) {
          article.category.forEach((c) => {
            const catScore = categoryWeights[c] || 0;
            score += catScore;
            if (catScore > reasonWeight) {
              reasonWeight = catScore;
              reason = `Because you read ${c}`;
            }
          });
        }

        const publishedAt = article.publishedAt || article.createdAt;
        const daysOld = (now - new Date(publishedAt).getTime()) / 86400000;
        const recencyBoost = Math.max(0, 3 - daysOld * 0.15);
        const popularityBoost = Math.log10(
          (article.clickCount || 0) + (article.likeCount || 0) + 1
        );
        return { article, score: score + recencyBoost + popularityBoost, reason };
      });
      scored.sort((a, b) => b.score - a.score);
      ranked = scored.slice(0, RESULT_LIMIT);

      if (ranked.length < MIN_RESULTS_BEFORE_BACKFILL) {
        const backfillExclude = [...excludedUrls, ...ranked.map((s) => s.article.url)];
        const backfill = await fetchTrending(
          Article,
          MIN_RESULTS_BEFORE_BACKFILL - ranked.length,
          backfillExclude,
          keywordExclusion
        );
        // Backfill is generic trending, not personalized — no reason attached.
        ranked = [...ranked, ...backfill.map((article) => ({ article, reason: null }))];
      }
    }

    const rankedUrls = ranked.map((r) => r.article.url);
    const userReads = rankedUrls.length
      ? await ReadArticle.findAll({
          where: { userId, articleUrl: { [Op.in]: rankedUrls } },
          attributes: ["articleUrl"],
        })
      : [];
    const readUrls = new Set(userReads.map((read) => read.articleUrl));

    const likedUrlSet = new Set(likedUrls);
    const articles = ranked.map(({ article: a, reason }) => ({
      ...a.toJSON(),
      isLikedByUser: likedUrlSet.has(a.url),
      isRead: readUrls.has(a.url),
      recommendationReason: reason,
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
