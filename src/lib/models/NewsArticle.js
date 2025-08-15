import { DataTypes, Model } from "sequelize";

class NewsArticle extends Model {}

export default function defineNewsArticle(sequelize) {
  NewsArticle.init(
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
      // description: {
      //   type: DataTypes.TEXT,
      //   allowNull: true,
      // },
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
    },
    {
      sequelize,
      modelName: "NewsArticle",
      timestamps: true,
    }
  );

  return NewsArticle;
}
