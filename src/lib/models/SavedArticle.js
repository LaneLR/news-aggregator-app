import { DataTypes, Model, Op } from "sequelize";

class SavedArticle extends Model {}

export default function defineSavedArticle(sequelize) {
  SavedArticle.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: "archive_url_unique",
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
      archiveId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: "archive_url_unique",
      },
    },
    {
      sequelize,
      modelName: "SavedArticle",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["url", "archiveId"], 
        },
      ],
    }
  );
  return SavedArticle;
}
