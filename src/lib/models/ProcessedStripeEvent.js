import { DataTypes, Model } from "sequelize";

class ProcessedStripeEvent extends Model {}

// Records Stripe webhook event IDs as they're processed so retried/duplicate
// deliveries (Stripe explicitly recommends handling this) are ignored instead
// of double-applying referral credits or double-sending emails.
export default function defineProcessedStripeEvent(sequelize) {
  ProcessedStripeEvent.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ProcessedStripeEvent",
      timestamps: true,
      updatedAt: false,
    }
  );

  return ProcessedStripeEvent;
}
