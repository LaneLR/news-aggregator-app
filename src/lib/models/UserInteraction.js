import { DataTypes, Model } from "sequelize";

class UserInteraction extends Model {}

// Per-user click history that powers the "For You" recommendation feed.
// sourceName/category are denormalized off the Article at write time so
// affinity scoring never has to join back to Articles (and survives an
// article being deleted later).
export default function defineUserInteraction(sequelize) {
  UserInteraction.init(
    {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      articleUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sourceName: {
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
      modelName: "UserInteraction",
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ["userId", "createdAt"] }],
    }
  );

  return UserInteraction;
}
