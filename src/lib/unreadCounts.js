import { Op } from "sequelize";
import { excludeGatedCategoriesCondition } from "./subscriberOnlyCategories";
import { buildKeywordExclusion } from "./keywordFilter";
import { buildKeywordInclusion } from "./followedKeywords";

// Bounds "unread" to a recent window rather than a user's entire history —
// otherwise a category nobody's visited in months would show a stale
// three-digit badge instead of a meaningful "what's new" signal. Matches
// the 7-day freshness window already used elsewhere (sitemap.js,
// getTrendingArticles' default).
const UNREAD_WINDOW_DAYS = 7;

// Keyed by lowercased category tag rather than the tag's stored casing —
// article categories aren't consistently cased ("US" is stored uppercase,
// "Journal" isn't), and the nav derives its lookup key from the lowercase
// URL slug, so matching case-insensitively here avoids hardcoding each
// category's exact casing in two places that could drift apart.
export async function getUnreadCounts(db, user, { isSubscribed } = {}) {
  const { Article, ReadArticle, Feed } = db;
  const since = new Date(Date.now() - UNREAD_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const whereConditions = [{ publishedAt: { [Op.gte]: since } }];
  if (!isSubscribed) whereConditions.push(excludeGatedCategoriesCondition());
  const keywordExclusion = buildKeywordExclusion(user.mutedKeywords);
  if (keywordExclusion) whereConditions.push(keywordExclusion);

  const [recentArticles, readRows, feeds] = await Promise.all([
    Article.findAll({
      where: { [Op.and]: whereConditions },
      attributes: ["url", "title", "category", "sourceName"],
    }),
    ReadArticle.findAll({ where: { userId: user.id }, attributes: ["articleUrl"] }),
    Feed.findAll({ where: { userId: user.id }, attributes: ["id", "sourceNames", "categories"] }),
  ]);

  const readUrls = new Set(readRows.map((r) => r.articleUrl));
  const unread = recentArticles.filter((a) => !readUrls.has(a.url));

  const categories = {};
  for (const article of unread) {
    for (const tag of article.category || []) {
      const key = tag.toLowerCase();
      categories[key] = (categories[key] || 0) + 1;
    }
  }

  let feedsCount = 0;
  if (feeds.length > 0) {
    feedsCount = unread.filter((article) =>
      feeds.some((feed) => {
        const matchesSource = feed.sourceNames?.includes(article.sourceName);
        const matchesCategory = feed.categories?.some((c) => (article.category || []).includes(c));
        return matchesSource || matchesCategory;
      })
    ).length;
  }

  let followingCount = 0;
  const keywordInclusion = buildKeywordInclusion(user.followedKeywords);
  if (keywordInclusion) {
    const lowered = (user.followedKeywords || []).map((k) => k.toLowerCase());
    followingCount = unread.filter((article) =>
      lowered.some((keyword) => (article.title || "").toLowerCase().includes(keyword))
    ).length;
  }

  return { categories, feeds: feedsCount, following: followingCount };
}
