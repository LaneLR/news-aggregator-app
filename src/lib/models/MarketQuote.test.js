import { describe, expect, it } from "vitest";
import defineMarketQuote from "./MarketQuote";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const MarketQuote = defineMarketQuote(sequelize);

function validQuote(overrides = {}) {
  return MarketQuote.build({
    symbol: "SPY",
    displayName: "S&P 500",
    price: 500.5,
    change: 1.2,
    changePercent: 0.24,
    ...overrides,
  });
}

describe("MarketQuote model", () => {
  it("defaults sortOrder to 0", () => {
    const quote = validQuote();
    expect(quote.sortOrder).toBe(0);
  });

  it("passes validation with all required fields present", async () => {
    await expect(validQuote().validate()).resolves.toBeDefined();
  });

  it("fails validation when displayName is missing", async () => {
    const quote = MarketQuote.build({ symbol: "SPY", price: 1, change: 1, changePercent: 1 });
    await expect(quote.validate()).rejects.toThrow();
  });

  it("fails validation when price is missing", async () => {
    const quote = MarketQuote.build({ symbol: "SPY", displayName: "S&P 500", change: 1, changePercent: 1 });
    await expect(quote.validate()).rejects.toThrow();
  });

  it("accepts an explicit sortOrder", () => {
    const quote = validQuote({ sortOrder: 3 });
    expect(quote.sortOrder).toBe(3);
  });
});
