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
    },
    {
      sequelize,
      modelName: "Article",
      timestamps: true,
      indexes: [
        { fields: ["publishedAt"] },
        { fields: ["category"], using: "gin" },
        { fields: ["sourceType"] },
        { fields: ["likeCount"] },
        { fields: ["clickCount"] },
      ],
    }
  );

  return Article;
}
