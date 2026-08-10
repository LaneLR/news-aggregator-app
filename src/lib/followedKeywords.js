import { Op } from "sequelize";

// Inverse of keywordFilter.js's buildKeywordExclusion: a where-fragment
// matching articles whose title contains ANY of the given followed
// keywords (OR, not AND — muting excludes on every match, following
// includes on the first match), or `null` when there's nothing to include.
export function buildKeywordInclusion(followedKeywords) {
  if (!followedKeywords || followedKeywords.length === 0) return null;

  return {
    [Op.or]: followedKeywords.map((keyword) => ({
      title: { [Op.iLike]: `%${keyword}%` },
    })),
  };
}
