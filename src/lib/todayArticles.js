import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { buildKeywordExclusion } from "@/lib/keywordFilter";
import { excludeGatedCategoriesCondition, excludePremiumArticlesCondition } from "@/lib/subscriberOnlyCategories";
import { orderByDesc } from "@/lib/dbOrder";

// "Today" spans every category rather than being one itself, so it applies
// the same combined visibility rule digest.js/news-by-category use for
// cross-category views (both the full Market/Journal lock and the
// per-article premium-tier gate) — not just excludePremiumArticlesCondition
// alone, which is all a single already-non-gated category page needs.
function visibilityConditions(isSubscribed) {
  return isSubscribed
    ? []
    : [excludeGatedCategoriesCondition(), excludePremiumArticlesCondition()];
}

// Shared by /api/news/today (the home page's preview carousel) and
// /api/articles/today (the dedicated, paginated "View all" page) — one
// query, not two copies that could drift.
//
// `startOfDay` is an ISO timestamp for local midnight, computed by the
// caller's browser (`new Date(); .setHours(0,0,0,0)`) and passed straight
// through — the server has no reliable way to know a visitor's timezone on
// its own, and every `publishedAt` value is already stored in UTC, so
// comparing against a client-computed boundary is both simpler and more
// correct than trying to derive "midnight" server-side.
export async function getTodayArticles({
  startOfDay,
  sort = "newest",
  userId,
  page = 1,
  limit = 24,
  isSubscribed = false,
}) {
  const { Article, ArticleLike, ReadArticle, User } = await initializeDbAndModels();
  const offset = (page - 1) * limit;

  const whereConditions = [
    { publishedAt: { [Op.gte]: new Date(startOfDay) } },
    ...visibilityConditions(isSubscribed),
  ];

  let likedUrls = new Set();
  let readUrls = new Set();
  if (userId) {
    const currentUser = await User.findByPk(userId, {
      attributes: ["mutedKeywords"],
    });
    const keywordExclusion = buildKeywordExclusion(currentUser?.mutedKeywords);
    if (keywordExclusion) whereConditions.push(keywordExclusion);

    const [userLikes, userReads] = await Promise.all([
      ArticleLike.findAll({ where: { userId }, attributes: ["articleUrl"] }),
      ReadArticle.findAll({ where: { userId }, attributes: ["articleUrl"] }),
    ]);
    likedUrls = new Set(userLikes.map((like) => like.articleUrl));
    readUrls = new Set(userReads.map((read) => read.articleUrl));
  }

  // "Trending" here means most-liked, same as elsewhere in the app once
  // you set aside clickCount-based "Trending" — the two names get used
  // for the same underlying signal in different places, and this feature
  // only needs one of them, so it's spelled "trending" but sorts by likes.
  const order =
    sort === "oldest"
      ? [["publishedAt", "ASC"]]
      : sort === "trending"
        ? [orderByDesc(Article, "likeCount")]
        : [orderByDesc(Article, "publishedAt")]; // "newest", the default

  const { rows, count } = await Article.findAndCountAll({
    where: { [Op.and]: whereConditions },
    order,
    limit,
    offset,
  });

  return {
    articles: rows.map((item) => ({
      ...item.toJSON(),
      isLikedByUser: likedUrls.has(item.url),
      isRead: readUrls.has(item.url),
    })),
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}
