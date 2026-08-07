import { literal } from "sequelize";

// Category slugs that require an active ("Subscribed") tier to view.
// Matched case-insensitively against the [category] route param.
export const SUBSCRIBER_ONLY_CATEGORIES = new Set(["market", "finance", "journal"]);

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
