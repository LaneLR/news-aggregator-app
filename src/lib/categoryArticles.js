import { Op } from "sequelize";
import initializeDbAndModels from "@/lib/db";
import { buildKeywordExclusion } from "@/lib/keywordFilter";

const SORT_COLUMNS = {
  liked: "likeCount",
  trending: "clickCount",
  latest: "publishedAt",
};

// Shared by /api/articles/[category] (client-side sort-toggle re-fetches)
// and the category page Server Components (initial server-rendered paint) —
// one query, not two copies that could drift.
export async function getCategoryArticles({
  category,
  sort = "latest",
  userId,
  page = 1,
  limit = 20,
}) {
  const { Article, ArticleLike, ReadArticle, User } = await initializeDbAndModels();
  const offset = (page - 1) * limit;
  const sortColumn = SORT_COLUMNS[sort] || SORT_COLUMNS.latest;
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  const whereConditions = [{ category: { [Op.contains]: [categoryName] } }];

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
    order: [[sortColumn, "DESC"]],
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
