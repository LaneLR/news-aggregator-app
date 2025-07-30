import { DataTypes, Model } from "sequelize";

class FetchedArticle extends Model {}

export default function defineFetchedArticle(sequelize) {
  FetchedArticle.init(
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
      description: {
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
    },
    {
      sequelize,
      modelName: "FetchedArticle",
      timestamps: true,
    }
  );

  return FetchedArticle;
}
