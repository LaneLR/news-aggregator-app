import { Op } from "sequelize";
import { excludeGatedCategoriesCondition, excludePremiumArticlesCondition } from "./subscriberOnlyCategories";
import { buildKeywordExclusion } from "./keywordFilter";
import { buildKeywordInclusion } from "./followedKeywords";
import { orderByDesc } from "./dbOrder";
import { getRecommendedArticles } from "./recommendations";
import { filterByMutedKeywords } from "./keywordFilter";

const DIGEST_LIMIT = 5;

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

// Alternative to getDigestArticles for a user whose digest is scoped to one
// of their own custom Feeds instead of general trending/personalized
// content.
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

// Free-tier equivalent of the Subscribed branch below — "For You" (see
// src/lib/recommendations.js) is a subscriber-only feature on the site
// itself, so the digest shouldn't hand it out for free by email either.
// Leads with anything matching a followed topic (the strongest non-gated
// signal available), then backfills with trending so there's always
// something worth sending.
//
// `trendingPool`: trending is identical for every Free-tier user, so a
// caller sending a batch of digests (see send-digests/route.js) can compute
// it once and pass it in here instead of this function re-querying it once
// per user. Falls back to querying it directly when called standalone.
async function getFreeTierDigestPicks(db, user, { limit, days, trendingPool }) {
  const { Article } = db;
  const [followed, trending] = await Promise.all([
    getFollowedArticles(Article, {
      isSubscribed: false,
      mutedKeywords: user.mutedKeywords,
      followedKeywords: user.followedKeywords,
      days,
      limit,
    }),
    trendingPool
      ? filterByMutedKeywords(trendingPool, user.mutedKeywords)
      : getTrendingArticles(Article, { isSubscribed: false, mutedKeywords: user.mutedKeywords, limit }),
  ]);

  const seen = new Set();
  const picks = [];
  for (const article of followed) {
    if (picks.length >= limit) break;
    if (seen.has(article.url)) continue;
    seen.add(article.url);
    picks.push({ article, reason: "From a topic you follow" });
  }
  for (const article of trending) {
    if (picks.length >= limit) break;
    if (seen.has(article.url)) continue;
    seen.add(article.url);
    picks.push({ article, reason: null });
  }
  return picks;
}

// Picks up to `limit` articles (default 5 — enough to be worth opening the
// email, not so many it turns into another feed to scroll) for a user's
// general, non-feed-scoped digest. Returns `[{ article, reason }]`, where
// `reason` is a short "Because you..." string or null for a trending pick.
export async function getDigestArticles(
  db,
  user,
  { isSubscribed, limit = DIGEST_LIMIT, days = 7, trendingPool } = {}
) {
  if (isSubscribed) {
    const ranked = await getRecommendedArticles(db, user.id, { limit });
    return ranked.slice(0, limit);
  }
  return getFreeTierDigestPicks(db, user, { limit, days, trendingPool });
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

const COLORS = {
  pageBg: "#f6f1e9",
  cardBg: "#fdfbf6",
  headerBg: "#1a140f",
  headerText: "#fdfbf6",
  accent: "#6f4225",
  accentTint: "#f0e3d3",
  textPrimary: "#1a140f",
  textSecondary: "#7a6a58",
  border: "#e7ddd0",
};

const SERIF_STACK = "Georgia, 'Times New Roman', serif";
const SANS_STACK = "Arial, Helvetica, sans-serif";

// A link goes to the article's own page on the site (which itself links out
// to the original source — see ArticleReader.jsx's "View original on..."),
// not straight to the third-party source — the digest is meant to bring
// readers back to MochaReads, not route around it.
function articleUrl(baseUrl, article) {
  return `${baseUrl}/article/${article.id}`;
}

function reasonPillHtml(reason) {
  const label = reason || "Trending now";
  return `<span style="display:inline-block;font-family:${SANS_STACK};font-size:11px;font-weight:700;letter-spacing:0.02em;color:${COLORS.accent};background-color:${COLORS.accentTint};border-radius:20px;padding:3px 10px;margin-bottom:6px;">${escapeHtml(label)}</span>`;
}

function articleRowHtml(baseUrl, { article, reason }, { isLast }) {
  const safeImageUrl =
    article.urlToImage && isSafeHttpUrl(article.urlToImage)
      ? escapeHtml(article.urlToImage)
      : null;
  const image = safeImageUrl
    ? `<img src="${safeImageUrl}" alt="" width="88" height="88" style="display:block;width:88px;height:88px;border-radius:10px;object-fit:cover;background-color:${COLORS.border};" />`
    : `<div style="width:88px;height:88px;border-radius:10px;background-color:${COLORS.accentTint};"></div>`;

  const title = escapeHtml(article.title);
  const link = escapeHtml(articleUrl(baseUrl, article));
  const titleHtml = `<a href="${link}" style="color:${COLORS.textPrimary};font-family:${SERIF_STACK};font-weight:700;font-size:17px;line-height:1.35;text-decoration:none;">${title}</a>`;

  return `
    <tr>
      <td style="padding:${isLast ? "18px" : "18px"} 0;border-bottom:${isLast ? "none" : `1px solid ${COLORS.border}`};" colspan="2">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:88px;vertical-align:top;">
              <a href="${link}" style="text-decoration:none;">${image}</a>
            </td>
            <td style="padding-left:14px;vertical-align:top;">
              ${reasonPillHtml(reason)}<br />
              ${titleHtml}
              <div style="margin-top:6px;font-family:${SANS_STACK};font-size:12px;color:${COLORS.textSecondary};">${escapeHtml(article.sourceName || "")}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function picksTableHtml(baseUrl, picks) {
  if (!picks.length) return "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${picks.map((pick, i) => articleRowHtml(baseUrl, pick, { isLast: i === picks.length - 1 })).join("")}
    </table>`;
}

// `picks` is `[{ article, reason }]`, already capped at the desired count —
// this function only renders, it doesn't decide what or how many to show
// (see getDigestArticles/getFeedScopedArticles for that).
export function buildDigestHtml({ picks, frequency, baseUrl, feedTitle }) {
  const cadence = frequency === "daily" ? "daily" : "weekly";
  const heading = feedTitle
    ? `New in &ldquo;${escapeHtml(feedTitle)}&rdquo;`
    : `Your ${cadence} picks`;
  const subheading = feedTitle
    ? "The latest from your custom feed."
    : "A short list, chosen for you — not everything, just what's worth your time.";

  const body = picksTableHtml(baseUrl, picks || []);

  return `
<div style="background-color:${COLORS.pageBg};padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background-color:${COLORS.cardBg};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background-color:${COLORS.headerBg};padding:20px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:30px;height:30px;background-color:${COLORS.accent};border-radius:6px;text-align:center;vertical-align:middle;">
              <span style="font-family:${SERIF_STACK};font-weight:700;font-size:16px;color:${COLORS.headerText};">M</span>
            </td>
            <td style="padding-left:10px;">
              <span style="font-family:${SERIF_STACK};font-weight:700;font-size:18px;color:${COLORS.headerText};">Mocha<span style="color:#c9925c;">Reads</span></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 28px 8px;">
        <h1 style="margin:0;font-family:${SERIF_STACK};font-size:24px;font-weight:700;color:${COLORS.textPrimary};">${heading}</h1>
        <p style="margin:8px 0 0;font-family:${SANS_STACK};font-size:13px;color:${COLORS.textSecondary};line-height:1.5;">${subheading}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 24px;">
        ${body}
      </td>
    </tr>
    <tr>
      <td style="padding:18px 28px;background-color:${COLORS.pageBg};border-top:1px solid ${COLORS.border};">
        <p style="margin:0;font-family:${SANS_STACK};font-size:12px;color:${COLORS.textSecondary};line-height:1.6;text-align:center;">
          You're getting this because you turned on email digests.<br />
          <a href="${escapeHtml(baseUrl)}/settings" style="color:${COLORS.accent};font-weight:600;text-decoration:none;">Manage your digest settings</a>
        </p>
      </td>
    </tr>
  </table>
</div>`;
}
