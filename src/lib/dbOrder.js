// A DESC order on a nullable column (Article.publishedAt, e.g.) puts NULLs
// first by Postgres's default — an article with no publish date (a
// malformed feed item, a dead source) would then sit permanently ahead of
// everything else in the sort regardless of how stale it actually is,
// never aging out naturally. NULLS LAST fixes that.
//
// Takes a bound model rather than a raw Sequelize instance (every
// Sequelize model carries its own `.sequelize` back-reference) so call
// sites don't need to separately destructure `sequelize` alongside
// whatever model they're already querying just to use this.
export function orderByDesc(Model, column) {
  return Model.sequelize.literal(`"${column}" DESC NULLS LAST`);
}
