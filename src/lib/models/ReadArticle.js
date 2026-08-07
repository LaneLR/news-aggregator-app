import { DataTypes, Model } from "sequelize";

class ReadArticle extends Model {}

export default function defineReadArticle(sequelize) {
  ReadArticle.init(
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
      modelName: "ReadArticle",
      timestamps: true,
    }
  );
  return ReadArticle;
}
