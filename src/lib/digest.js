import { Op } from "sequelize";
import { SUBSCRIBER_ONLY_CATEGORIES } from "./subscriberOnlyCategories";

const GATED_TAGS = [...SUBSCRIBER_ONLY_CATEGORIES].map(
  (slug) => slug.charAt(0).toUpperCase() + slug.slice(1)
);

function visibilityCondition(isSubscribed) {
  return isSubscribed
    ? []
    : [{ category: { [Op.not]: { [Op.overlap]: GATED_TAGS } } }];
}

export async function getTrendingArticles(Article, { isSubscribed, days = 7, limit = 6 }) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return Article.findAll({
    where: {
      [Op.and]: [
        { publishedAt: { [Op.gte]: since } },
        { clickCount: { [Op.gt]: 0 } },
        ...visibilityCondition(isSubscribed),
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
        ...visibilityCondition(isSubscribed),
      ],
    },
    order: [["publishedAt", "DESC"]],
    limit,
  });
}

function articleRowHtml(article) {
  const image = article.urlToImage
    ? `<img src="${article.urlToImage}" alt="" width="72" height="72" style="border-radius:8px;object-fit:cover;display:block;" />`
    : "";
  return `
    <tr>
      <td style="padding:10px 0;vertical-align:top;width:80px;">${image}</td>
      <td style="padding:10px 0 10px 12px;vertical-align:top;">
        <a href="${article.url}" style="color:#0a1430;font-weight:600;text-decoration:none;font-size:15px;">${article.title}</a>
        <div style="color:#777;font-size:12px;margin-top:4px;">${article.sourceName || ""}</div>
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

export function buildDigestHtml({ trending, picks, frequency, baseUrl }) {
  const cadence = frequency === "daily" ? "Today's" : "This week's";
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
      <h1 style="font-size:22px;color:#0a1430;">${cadence} MorningFeeds digest</h1>
      ${sectionHtml("Picked for you", picks)}
      ${sectionHtml("Trending now", trending)}
      <p style="margin-top:28px;font-size:12px;color:#999;">
        You're getting this because you turned on email digests.
        <a href="${baseUrl}/settings">Manage your digest settings</a>.
      </p>
    </div>`;
}
