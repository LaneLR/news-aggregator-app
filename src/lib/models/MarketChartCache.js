import { DataTypes, Model } from "sequelize";

class MarketChartCache extends Model {}

// Shared cache of Yahoo Finance chart data per (symbol, range) pair — see
// lib/chartData.js. Composite primary key since a symbol has one row per
// range ("SPY"/"1mo", "SPY"/"1y", etc), each refreshed on its own schedule.
export default function defineMarketChartCache(sequelize) {
  MarketChartCache.init(
    {
      symbol: { type: DataTypes.STRING, primaryKey: true },
      rangeKey: { type: DataTypes.STRING, primaryKey: true },
      points: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    },
    { sequelize, modelName: "MarketChartCache", timestamps: true }
  );
  return MarketChartCache;
}
