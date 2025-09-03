import { DataTypes, Model } from "sequelize";

class ArticleLike extends Model {}

export default function defineArticleLike(sequelize) {
  ArticleLike.init(
    {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users", 
          key: "id",
        },
        primaryKey: true, 
      },
      articleUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true, 
      },
    },
    {
      sequelize,
      modelName: "ArticleLike",
      timestamps: true,
    }
  );
  return ArticleLike;
}
