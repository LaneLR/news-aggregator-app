import { DataTypes, Model } from "sequelize";

class IpAttempt extends Model {}

// Backs authRateLimitMiddleware (src/lib/rate-limiter.js) — one row per IP
// that has hit a rate-limited auth route. windowCount/windowStart track the
// base "N requests per minute" limit; violationCount/lockedUntil layer an
// escalating lockout on top for IPs that keep tripping it (5 minutes, then
// 1 hour, then a 24-hour ceiling), so a handful of mistyped passwords
// barely slows a real user down while sustained brute-forcing gets
// exponentially more expensive fast. violationCount resets after a full day
// with no further violations (lastViolationAt), so a single past incident
// doesn't compound forever.
export default function defineIpAttempt(sequelize) {
  IpAttempt.init(
    {
      ip: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      windowCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      windowStart: { type: DataTypes.DATE, allowNull: true },
      violationCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lockedUntil: { type: DataTypes.DATE, allowNull: true },
      lastViolationAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: "IpAttempt", timestamps: true }
  );
  return IpAttempt;
}
