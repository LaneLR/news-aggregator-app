import { Op } from "sequelize";
import { excludeGatedCategoriesCondition, excludePremiumArticlesCondition } from "./subscriberOnlyCategories";
import { buildKeywordExclusion } from "./keywordFilter";
import { buildKeywordInclusion } from "./followedKeywords";
import { orderByDesc } from "./dbOrder";

function visibilityCondition(isSubscribed, mutedKeywords) {
  const conditions = isSubscribed
    ? []
    : [excludeGatedCategoriesCondition(), excludePremiumArticlesCondition()];

  const keywordExclusion = buildKeywordExclusion(mutedKeywords);
  if (keywordExclusion) conditions.push(keywordExclusion);

  return conditions;
}

export async function getTrendingArticles(
  Article,
  { isSubscribed, days = 7, limit = 6, mutedKeywords }
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return Article.findAll({
    where: {
      [Op.and]: [
        { publishedAt: { [Op.gte]: since } },
        { clickCount: { [Op.gt]: 0 } },
        ...visibilityCondition(isSubscribed, mutedKeywords),
      ],
    },
    order: [["clickCount", "DESC"]],
    limit,
  });
}

// Looks at what a user has liked/saved recently, finds their most common
// article categories, and pulls recent top articles from those categories
// that they haven't already seen.
export async function getPersonalizedPicks(db, user, { isSubscribed, limit = 6 } = {}) {
  const { ArticleLike, SavedArticle, Archive, Article } = db;

  const [likes, saved] = await Promise.all([
    ArticleLike.findAll({
      where: { userId: user.id },
      limit: 50,
      order: [["createdAt", "DESC"]],
      attributes: ["articleUrl"],
    }),
    SavedArticle.findAll({
      include: [{ model: Archive, where: { userId: user.id }, required: true, attributes: [] }],
      limit: 50,
      order: [["createdAt", "DESC"]],
      attributes: ["url"],
    }),
  ]);

  const seenUrls = new Set([
    ...likes.map((l) => l.articleUrl),
    ...saved.map((s) => s.url),
  ]);

  if (seenUrls.size === 0) return [];

  const historyArticles = await Article.findAll({
    where: { url: { [Op.in]: [...seenUrls] } },
    attributes: ["category"],
  });

  const categoryCounts = new Map();
  for (const article of historyArticles) {
    for (const category of article.category || []) {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  }

  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  if (topCategories.length === 0) return [];

  return Article.findAll({
    where: {
      [Op.and]: [
        { category: { [Op.overlap]: topCategories } },
        { url: { [Op.notIn]: [...seenUrls] } },
        ...visibilityCondition(isSubscribed, user.mutedKeywords),
      ],
    },
    order: [orderByDesc(Article, "publishedAt")],
    limit,
  });
}

// Alternative to getTrendingArticles/getPersonalizedPicks for a user whose
// digest is scoped to one of their own custom Feeds instead of general
// trending/personalized content.
export async function getFeedScopedArticles(Article, feed, { mutedKeywords, limit = 10 } = {}) {
  const orConditions = [];
  if (feed.sourceNames?.length) orConditions.push({ sourceName: { [Op.in]: feed.sourceNames } });
  if (feed.categories?.length) orConditions.push({ category: { [Op.overlap]: feed.categories } });
  if (orConditions.length === 0) return [];

  const conditions = [{ [Op.or]: orConditions }];
  const keywordExclusion = buildKeywordExclusion(mutedKeywords);
  if (keywordExclusion) conditions.push(keywordExclusion);

  return Article.findAll({
    where: { [Op.and]: conditions },
    order: [orderByDesc(Article, "publishedAt")],
    limit,
  });
}

// Independent of the trending/personalized/feed-scoped branch below — a
// followed topic is worth surfacing in the digest no matter which of those
// modes the user is otherwise in.
export async function getFollowedArticles(Article, { isSubscribed, mutedKeywords, followedKeywords, days = 7, limit = 8 } = {}) {
  const keywordInclusion = buildKeywordInclusion(followedKeywords);
  if (!keywordInclusion) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);

  return Article.findAll({
    where: {
      [Op.and]: [
        keywordInclusion,
        { publishedAt: { [Op.gte]: since } },
        ...visibilityCondition(isSubscribed, mutedKeywords),
      ],
    },
    order: [orderByDesc(Article, "publishedAt")],
    limit,
  });
}

// Article fields (title, url, urlToImage, sourceName) originate from
// third-party RSS feeds, not from this app — they must be escaped before
// going into a raw HTML string the same way JSX would auto-escape them.
// (JSX rendering elsewhere in the app is already safe by construction; this
// hand-built email template is the one place that needed it done manually.)
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeHttpUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function articleRowHtml(article) {
  const safeImageUrl =
    article.urlToImage && isSafeHttpUrl(article.urlToImage)
      ? escapeHtml(article.urlToImage)
      : null;
  const image = safeImageUrl
    ? `<img src="${safeImageUrl}" alt="" width="72" height="72" style="border-radius:8px;object-fit:cover;display:block;" />`
    : "";

  const title = escapeHtml(article.title);
  const titleHtml = isSafeHttpUrl(article.url)
    ? `<a href="${escapeHtml(article.url)}" style="color:#0a1430;font-weight:600;text-decoration:none;font-size:15px;">${title}</a>`
    : `<span style="color:#0a1430;font-weight:600;font-size:15px;">${title}</span>`;

  return `
    <tr>
      <td style="padding:10px 0;vertical-align:top;width:80px;">${image}</td>
      <td style="padding:10px 0 10px 12px;vertical-align:top;">
        ${titleHtml}
        <div style="color:#777;font-size:12px;margin-top:4px;">${escapeHtml(article.sourceName || "")}</div>
      </td>
    </tr>`;
}

function sectionHtml(title, articles) {
  if (!articles.length) return "";
  return `
    <h2 style="font-size:18px;color:#0a1430;border-bottom:2px solid #eee;padding-bottom:6px;margin:24px 0 4px;">${title}</h2>
    <table role="presentation" width="100%" style="border-collapse:collapse;">
      ${articles.map(articleRowHtml).join("")}
    </table>`;
}

export function buildDigestHtml({ trending, picks, frequency, baseUrl, feedTitle, feedArticles, followed }) {
  const cadence = frequency === "daily" ? "Today's" : "This week's";
  const body = feedTitle
    ? sectionHtml(`New in "${escapeHtml(feedTitle)}"`, feedArticles || [])
    : `${sectionHtml("Picked for you", picks)}${sectionHtml("Trending now", trending)}`;
  const followedSection = sectionHtml("Topics you follow", followed || []);
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
      <h1 style="font-size:22px;color:#0a1430;">${cadence} MochaReads digest</h1>
      ${followedSection}${body}
      <p style="margin-top:28px;font-size:12px;color:#999;">
        You're getting this because you turned on email digests.
        <a href="${baseUrl}/settings">Manage your digest settings</a>.
      </p>
    </div>`;
}
