import { DataTypes, Model, Op } from "sequelize";

class Archive extends Model {}

export default function defineArchive(sequelize) {
  Archive.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Archive",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["userId", "name"],
        },
      ],
    }
  );
  return Archive;
}
