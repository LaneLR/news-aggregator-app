import { DataTypes, Model } from "sequelize";

class Article extends Model {}

// Consolidates the formerly-separate NewsArticle / JournalArticle /
// MarketArticle / Podcast tables (identical schemas, split only by source)
// into one table distinguished by `sourceType`. See
// src/utils/migrateArticles.mjs for the one-time data migration from the
// old tables.
export default function defineArticle(sequelize) {
  Article.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      urlToImage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sourceName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      category: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      clickCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      sourceType: {
        type: DataTypes.ENUM("news", "journal", "market", "podcast"),
        allowNull: false,
        defaultValue: "news",
      },
      // Per-source access tier, independent of sourceType/category. "premium"
      // rows are hidden from Free-tier/anonymous viewers everywhere except
      // Market/Journal (those two categories are fully gated regardless of
      // tier — see src/lib/subscriberOnlyCategories.js) and sourceType
      // "podcast" (podcasts are always free regardless of tier). Set at
      // ingestion time from each feed config entry's own "tier" field.
      tier: {
        type: DataTypes.ENUM("free", "premium"),
        allowNull: false,
        defaultValue: "free",
      },
      // Full article HTML, when the source feed includes it (many WordPress
      // feeds ship this via <content:encoded>). Populated by the RSS worker
      // going forward only — existing rows stay null and the reader falls
      // back to the external link. Always sanitized before rendering
      // (see /article/[id]) since this is third-party HTML.
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Which hubCities.js metro this article's source covers, e.g.
      // "dallas-fort-worth" — null for every non-local source. Set at
      // ingestion time from a local feed config entry's own "hubCity"
      // field (see rss-fetch-app's feeds/localSources.json), independent
      // of `category`: a local article keeps its normal category tags too,
      // so it still shows up on category pages in addition to Local News.
      hubCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Article",
      timestamps: true,
      indexes: [
        { fields: ["publishedAt"] },
        { fields: ["category"], using: "gin" },
        { fields: ["sourceType"] },
        { fields: ["tier"] },
        { fields: ["likeCount"] },
        { fields: ["clickCount"] },
        { fields: ["hubCity"] },
      ],
    }
  );

  return Article;
}
