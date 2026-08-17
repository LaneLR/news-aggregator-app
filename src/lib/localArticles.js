import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { buildKeywordExclusion } from "@/lib/keywordFilter";
import { excludePremiumArticlesCondition } from "@/lib/subscriberOnlyCategories";
import { orderByDesc } from "@/lib/dbOrder";

// Shared by /api/news/local (the home page's preview carousel) and
// /api/articles/local (the dedicated, paginated "View all" page) — one
// query, not two copies that could drift. Mirrors todayArticles.js's shape,
// but filters by a resolved hub-city id instead of a publishedAt boundary.
//
// Local sources are always tagged with an ordinary, never-gated category
// (see rss-fetch-app's feeds/localSources.json — currently "US"), so this
// only needs the plain per-article premium-tier exclusion, not the combined
// gated-category rule todayArticles.js uses for its cross-category view.
export async function getLocalArticles({
  hubCityId,
  sort = "newest",
  userId,
  page = 1,
  limit = 24,
  isSubscribed = false,
}) {
  const { Article, ArticleLike, ReadArticle, User } = await initializeDbAndModels();
  const offset = (page - 1) * limit;

  const whereConditions = [
    { hubCity: hubCityId },
    ...(isSubscribed ? [] : [excludePremiumArticlesCondition()]),
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
