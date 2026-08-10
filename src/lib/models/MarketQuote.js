import { DataTypes, Model } from "sequelize";

class MarketQuote extends Model {}

// One row per tracked index, shared by every visitor — see
// src/lib/marketData.js. `updatedAt` (standard Sequelize timestamp) doubles
// as "when was this last refreshed from the data provider", which is what
// decides whether a request triggers a re-fetch and what the UI's "Last
// updated at" reads.
export default function defineMarketQuote(sequelize) {
  MarketQuote.init(
    {
      symbol: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      change: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      changePercent: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "MarketQuote",
      timestamps: true,
    }
  );

  return MarketQuote;
}
