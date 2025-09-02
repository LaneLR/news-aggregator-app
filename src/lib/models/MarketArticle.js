import { DataTypes, Model } from "sequelize";

class MarketArticle extends Model {}

export default function defineMarketArticle(sequelize) {
  MarketArticle.init(
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
    },
    {
      sequelize,
      modelName: "MarketArticle",
      timestamps: true,
    }
  );

  return MarketArticle;
}
