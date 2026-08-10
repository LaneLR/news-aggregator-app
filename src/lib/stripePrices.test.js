import { describe, expect, it } from "vitest";
import {
  MONTHLY_PRICE_ID,
  ANNUAL_PRICE_ID,
  billingIntervalForPrice,
} from "./stripePrices";

describe("billingIntervalForPrice", () => {
  it("returns 'monthly' for the monthly price id", () => {
    expect(billingIntervalForPrice(MONTHLY_PRICE_ID)).toBe("monthly");
  });

  it("returns 'annual' for the annual price id", () => {
    expect(billingIntervalForPrice(ANNUAL_PRICE_ID)).toBe("annual");
  });

  it("returns null for an unknown price id", () => {
    expect(billingIntervalForPrice("price_unknown")).toBeNull();
  });

  it("returns null for undefined/empty input", () => {
    expect(billingIntervalForPrice(undefined)).toBeNull();
    expect(billingIntervalForPrice("")).toBeNull();
  });
});
