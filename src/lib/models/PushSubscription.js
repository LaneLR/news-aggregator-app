import { DataTypes, Model } from "sequelize";

class PushSubscription extends Model {}

// One row per subscribed browser/device — a user with phone + laptop both
// subscribed gets two rows, both notified. `endpoint` is unique per
// browser+device pairing (assigned by the browser's push service), so it
// doubles as the natural dedupe key.
export default function definePushSubscription(sequelize) {
  PushSubscription.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
      },
      endpoint: { type: DataTypes.TEXT, allowNull: false, unique: true },
      p256dh: { type: DataTypes.STRING, allowNull: false },
      auth: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "PushSubscription",
      timestamps: true,
      indexes: [{ fields: ["userId"] }],
    }
  );
  return PushSubscription;
}
