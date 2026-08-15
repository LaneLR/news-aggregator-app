import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { buildKeywordExclusion } from "@/lib/keywordFilter";
import { excludePremiumArticlesCondition } from "@/lib/subscriberOnlyCategories";
import { orderByDesc } from "@/lib/dbOrder";

const SORT_COLUMNS = {
  liked: "likeCount",
  trending: "clickCount",
  latest: "publishedAt",
};

// Logged-out visitors get a small teaser of a category instead of the full
// paginated list — see the route-level check in
// /api/articles/[category]/route.js, which rejects any request for page 2+
// or a non-"latest" sort while signed out. Capping the limit here too
// protects the SSR category page's own initial-load call, which always
// requests the ordinary page-1 default and would otherwise hand back a
// full page.
export const ANONYMOUS_ARTICLE_LIMIT = 10;

// Shared by /api/articles/[category] (client-side sort-toggle re-fetches)
// and the category page Server Components (initial server-rendered paint) —
// one query, not two copies that could drift.
export async function getCategoryArticles({
  category,
  sort = "latest",
  userId,
  page = 1,
  // 24, not 20 — divides evenly into a 2/3/4/6/8-column grid with no
  // orphaned partial row at the end, in both card-grid and magazine
  // density. 20 only divides evenly by 2/4/5/10, which is why a 3-column
  // grid was landing on a lone 2-card final row.
  limit = 24,
  isSubscribed = false,
}) {
  const { Article, ArticleLike, ReadArticle, User } = await initializeDbAndModels();
  const effectiveLimit = userId ? limit : Math.min(limit, ANONYMOUS_ARTICLE_LIMIT);
  const offset = (page - 1) * effectiveLimit;
  const sortColumn = SORT_COLUMNS[sort] || SORT_COLUMNS.latest;
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  const whereConditions = [{ category: { [Op.contains]: [categoryName] } }];
  // Free/anonymous viewers only see this category's curated free sources
  // (plus podcasts, always free) — Market/Journal are excluded entirely
  // before this function is ever reached (see the 403 in
  // /api/articles/[category]/route.js), so this only matters for the
  // partially-gated categories.
  if (!isSubscribed) whereConditions.push(excludePremiumArticlesCondition());

  let likedUrls = new Set();
  let readUrls = new Set();
  if (userId) {
    const currentUser = await User.findByPk(userId, {
      attributes: ["mutedKeywords"],
    });
    const keywordExclusion = buildKeywordExclusion(currentUser?.mutedKeywords);
    if (keywordExclusion) whereConditions.push(keywordExclusion);

    const [userLikes, userReads] = await Promise.all([
      ArticleLike.findAll({
        where: { userId },
        attributes: ["articleUrl"],
      }),
      ReadArticle.findAll({
        where: { userId },
        attributes: ["articleUrl"],
      }),
    ]);
    likedUrls = new Set(userLikes.map((like) => like.articleUrl));
    readUrls = new Set(userReads.map((read) => read.articleUrl));
  }

  const { rows, count } = await Article.findAndCountAll({
    where: { [Op.and]: whereConditions },
    order: [orderByDesc(Article, sortColumn)],
    limit: effectiveLimit,
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
    totalPages: Math.ceil(count / effectiveLimit),
  };
}
