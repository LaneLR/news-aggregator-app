import { literal } from "sequelize";

// Categories that are fully locked for Free/anonymous visitors — no
// articles at all, just an upsell teaser page (see GatedCategoryTeaser.jsx
// and src/app/category/{market,journal}/page.jsx). Every other category,
// including Finance, instead shows a curated free selection of sources to
// non-subscribers with the rest gated per-article — see
// excludePremiumArticlesCondition below and Article.tier.
export const SUBSCRIBER_ONLY_CATEGORIES = new Set(["market", "journal"]);

// Matches the capitalized category tags stored on articles (e.g. "Market"),
// derived from the lowercase slugs above.
export const GATED_TAGS = [...SUBSCRIBER_ONLY_CATEGORIES].map(
  (slug) => slug.charAt(0).toUpperCase() + slug.slice(1)
);

// Sequelize's `{ [Op.not]: { [Op.overlap]: GATED_TAGS } }` crashes the
// Postgres query generator for this Sequelize version — it calls
// ARRAY._stringify on the inner Op.overlap operator object instead of
// recursing into it, throwing "values.map is not a function". This is the
// working equivalent, built as a raw literal since GATED_TAGS is a small
// fixed constant (not user input), with quotes still escaped defensively.
export function excludeGatedCategoriesCondition(columnName = "category") {
  const tagsSql = GATED_TAGS.map((t) => `'${t.replace(/'/g, "''")}'`).join(",");
  return literal(`NOT ("${columnName}" && ARRAY[${tagsSql}]::varchar[])`);
}

// A row is visible to a Free/anonymous viewer of a *non-fully-gated*
// category: either it's a "free"-tier source, or it's a podcast (podcasts
// are always free regardless of tier — see Article.tier's comment). Doesn't
// know anything about Market/Journal's full-category lock — callers inside
// those two categories rely on excludeGatedCategoriesCondition/
// SUBSCRIBER_ONLY_CATEGORIES instead, since every row there is gated
// regardless of tier.
export function excludePremiumArticlesCondition() {
  return literal(`("tier" = 'free' OR "sourceType" = 'podcast')`);
}

// Plain SQL fragments (not wrapped in Sequelize's literal()) for callers
// building raw SQL via sequelize.query() — /api/search, /api/search/
// suggestions, /api/fetched — rather than the ORM's `where` object. Same
// semantics as excludePremiumArticlesCondition/excludeGatedCategoriesCondition
// above; kept as a single source of truth so the three raw-SQL routes can't
// drift from each other or from the ORM path.
export const FREE_TIER_SQL = `("tier" = 'free' OR "sourceType" = 'podcast')`;
export const EXCLUDE_GATED_CATEGORIES_SQL = (() => {
  const tagsSql = GATED_TAGS.map((t) => `'${t.replace(/'/g, "''")}'`).join(",");
  return `NOT ("category" && ARRAY[${tagsSql}]::varchar[])`;
})();
