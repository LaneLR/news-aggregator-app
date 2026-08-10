import { describe, expect, it } from "vitest";
import defineMarketChartCache from "./MarketChartCache";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const MarketChartCache = defineMarketChartCache(sequelize);

describe("MarketChartCache model", () => {
  it("applies a default empty array for points", () => {
    const cache = MarketChartCache.build({ symbol: "SPY", rangeKey: "1mo" });
    expect(cache.points).toEqual([]);
  });

  it("passes validation with the composite key fields present", async () => {
    const cache = MarketChartCache.build({ symbol: "SPY", rangeKey: "1mo" });
    await expect(cache.validate()).resolves.toBeDefined();
  });

  it("fails validation when points is explicitly null", async () => {
    const cache = MarketChartCache.build({ symbol: "SPY", rangeKey: "1mo", points: null });
    await expect(cache.validate()).rejects.toThrow();
  });

  it("stores an explicit points payload", () => {
    const points = [{ t: 1, c: 100 }];
    const cache = MarketChartCache.build({ symbol: "SPY", rangeKey: "1mo", points });
    expect(cache.points).toEqual(points);
  });
});
