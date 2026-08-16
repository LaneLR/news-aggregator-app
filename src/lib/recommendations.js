import { Op } from "sequelize";
import { buildKeywordExclusion } from "./keywordFilter";
import { orderByDesc } from "./dbOrder";

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
//
// Shared by /api/recommendations (the site's subscriber-only "For You" page)
// and the Subscribed-tier email digest (src/lib/digest.js) — both should
// mean the same thing by "picked for you" rather than the digest running its
// own, weaker approximation of the site's real personalization.
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

// Returns `[{ article, reason }]`, ranked highest-affinity first. `reason`
// is a human-readable "Because you..." string (or null for trending
// backfill with no personalization signal behind it).
export async function getRecommendedArticles(db, userId, { limit = RESULT_LIMIT } = {}) {
  const { Article, ArticleLike, ReadArticle, SavedArticle, Archive, UserInteraction, User } = db;

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
      attributes: ["mutedKeywords", "preferredCategories", "preferredSources", "followedSources"],
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
  // A followed source (see FollowSourceButton) is the strongest signal of
  // all — a standing, explicit "show me more of this" the user opted
  // into, not a one-off action on a single article, so it outweighs even
  // a saved article.
  (currentUser?.followedSources || []).forEach((s) => addSignal(s, null, 6));

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
    const trending = await fetchTrending(Article, limit, excludedUrls, keywordExclusion);
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
      order: [orderByDesc(Article, "publishedAt")],
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
    ranked = scored.slice(0, limit);

    if (ranked.length < Math.min(MIN_RESULTS_BEFORE_BACKFILL, limit)) {
      const backfillExclude = [...excludedUrls, ...ranked.map((s) => s.article.url)];
      const backfill = await fetchTrending(
        Article,
        Math.min(MIN_RESULTS_BEFORE_BACKFILL, limit) - ranked.length,
        backfillExclude,
        keywordExclusion
      );
      // Backfill is generic trending, not personalized — no reason attached.
      ranked = [...ranked, ...backfill.map((article) => ({ article, reason: null }))];
    }
  }

  return ranked;
}
