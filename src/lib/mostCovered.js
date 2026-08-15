import { Op } from "sequelize";
import { TRACKED_COMPANIES } from "./trackedCompanies";
import { orderByDesc } from "./dbOrder";

const LOOKBACK_DAYS = 7;
const ARTICLE_SCAN_LIMIT = 500;
const RESULT_LIMIT = 8;

function buildAliasPattern(alias) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

const COMPANY_PATTERNS = TRACKED_COMPANIES.map((company) => ({
  ...company,
  patterns: company.aliases.map(buildAliasPattern),
}));

// Derived entirely from articles already in our own DB — no external API,
// no ongoing cost. A heuristic title-keyword count against a curated
// company list (lib/trackedCompanies.js), not real entity extraction, so
// treat it as a "what's trending" signal rather than an authoritative one.
export async function getMostCoveredCompanies(Article) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const articles = await Article.findAll({
    where: {
      category: { [Op.overlap]: ["Market", "Finance", "Business"] },
      publishedAt: { [Op.gte]: since },
    },
    attributes: ["id", "title", "url", "publishedAt"],
    order: [orderByDesc(Article, "publishedAt")],
    limit: ARTICLE_SCAN_LIMIT,
  });

  const counts = COMPANY_PATTERNS.map((company) => {
    let count = 0;
    let latestMatch = null;
    for (const article of articles) {
      if (company.patterns.some((pattern) => pattern.test(article.title))) {
        count += 1;
        if (!latestMatch) latestMatch = article;
      }
    }
    return {
      name: company.name,
      ticker: company.ticker,
      count,
      articleId: latestMatch?.id ?? null,
      articleTitle: latestMatch?.title ?? null,
      articleUrl: latestMatch?.url ?? null,
    };
  });

  return counts
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, RESULT_LIMIT);
}
