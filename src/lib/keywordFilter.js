import { Op } from "sequelize";

// A Sequelize where-fragment that excludes articles whose title contains any
// of the given muted keywords, or `null` when there's nothing to exclude —
// safe to conditionally push into an existing Op.and array either way.
// Kept as ILIKE-per-keyword (not a single regex) so each term is a plain,
// injection-safe bound parameter rather than hand-built pattern syntax.
export function buildKeywordExclusion(mutedKeywords) {
  if (!mutedKeywords || mutedKeywords.length === 0) return null;

  return {
    [Op.and]: mutedKeywords.map((keyword) => ({
      title: { [Op.notILike]: `%${keyword}%` },
    })),
  };
}

// In-memory counterpart for lists that were already fetched without a
// per-user where-clause (e.g. digest.js's shared "trending" query, computed
// once for all users of a tier rather than per-recipient).
export function filterByMutedKeywords(articles, mutedKeywords) {
  if (!mutedKeywords || mutedKeywords.length === 0) return articles;
  const lowered = mutedKeywords.map((k) => k.toLowerCase());
  return articles.filter((article) => {
    const title = (article.title || "").toLowerCase();
    return !lowered.some((keyword) => title.includes(keyword));
  });
}
