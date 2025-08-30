import { DataTypes, Model } from "sequelize";

class Feed extends Model {}

export default function defineFeed(sequelize) {
  Feed.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sourceNames: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
        comment: "An array of selected source names for this feed.",
      },
      categories: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
        comment: "An array of selected categories for this feed.",
      },
    },
    {
      sequelize,
      modelName: "Feed",
      timestamps: true,
    }
  );

  return Feed;
}
