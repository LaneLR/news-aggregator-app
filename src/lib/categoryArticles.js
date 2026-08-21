import { Op, literal } from "sequelize";
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
  // orphaned partial row at the end. 20 only divides evenly by 2/4/5/10,
  // which is why a 3-column grid was landing on a lone 2-card final row.
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
  let keywordExclusion;
  if (userId) {
    const currentUser = await User.findByPk(userId, {
      attributes: ["mutedKeywords"],
    });
    keywordExclusion = buildKeywordExclusion(currentUser?.mutedKeywords);
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

  const articles = rows.map((item) => ({
    ...item.toJSON(),
    isLikedByUser: likedUrls.has(item.url),
    isRead: readUrls.has(item.url),
  }));

  const withTeasers = isSubscribed
    ? articles
    : await injectPremiumTeasers(Article, articles, {
        categoryName,
        keywordExclusion,
        // The anonymous 10-item preview is already a small, incomplete
        // feed meant to nudge signup, not upgrade — one locked teaser is
        // enough there; a logged-in Free viewer's full 24-item page can
        // carry the 2-3 the product actually wants without reading as
        // paywall spam (see feedback on teaser "dosage").
        count: userId ? (Math.random() < 0.5 ? 2 : 3) : 1,
      });

  return {
    articles: withTeasers,
    total: count,
    page,
    totalPages: Math.ceil(count / effectiveLimit),
  };
}

// Sprinkles a handful of premium-tier articles from the same category into
// an otherwise-free feed, rendered by the client as a locked/blurred
// "MochaReads Pro" teaser (see PremiumTeaserCard.jsx) rather than a normal
// card — title/source/image are real (that's the whole point: a specific,
// enticing headline converts better than an abstract upsell), but nothing
// else about the row is meant to be readable, so this strips every field
// that isn't needed to render the locked card.
async function injectPremiumTeasers(Article, freeArticles, { categoryName, keywordExclusion, count }) {
  if (freeArticles.length === 0 || count <= 0) return freeArticles;

  // Independent conditions, not a reuse of the free query's — that query's
  // own condition (excludePremiumArticlesCondition) exists specifically to
  // EXCLUDE the rows this one needs to find, so building from scratch is
  // clearer than trying to subtract one condition back out of the other
  // list. Podcasts are always free regardless of `tier` (see Article.js's
  // comment), so excluded here the same way the free query excludes them
  // implicitly via excludePremiumArticlesCondition.
  const premiumConditions = [
    { category: { [Op.contains]: [categoryName] } },
    literal(`"tier" = 'premium' AND "sourceType" != 'podcast'`),
  ];
  if (keywordExclusion) premiumConditions.push(keywordExclusion);

  const teaserRows = await Article.findAll({
    where: { [Op.and]: premiumConditions },
    // Random, not "latest" — a fixed top-N would show the exact same 2-3
    // locked articles on every page/refresh, which reads as a bug rather
    // than a rotating preview of what Pro unlocks.
    order: [literal("RANDOM()")],
    limit: count,
  });

  if (teaserRows.length === 0) return freeArticles;

  const teasers = teaserRows.map((item) => ({
    id: item.id,
    url: item.url,
    title: item.title,
    urlToImage: item.urlToImage,
    sourceName: item.sourceName,
    category: item.category,
    publishedAt: item.publishedAt,
    isPremiumTeaser: true,
  }));

  // Spreads teasers evenly through the page instead of clustering them at
  // one end — divides the free articles into `teasers.length` roughly-even
  // segments and inserts one teaser near the end of each.
  const result = [...freeArticles];
  const segmentSize = Math.max(1, Math.floor(result.length / teasers.length));
  teasers.forEach((teaser, i) => {
    const insertAt = Math.min(result.length, (i + 1) * segmentSize + i);
    result.splice(insertAt, 0, teaser);
  });

  return result;
}
