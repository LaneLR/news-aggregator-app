import { describe, expect, it } from "vitest";
import { TRACKED_COMPANIES } from "./trackedCompanies";

describe("TRACKED_COMPANIES", () => {
  it("gives every entry a name, ticker, and at least one alias", () => {
    for (const company of TRACKED_COMPANIES) {
      expect(company.name).toBeTruthy();
      expect(company.ticker).toBeTruthy();
      expect(Array.isArray(company.aliases)).toBe(true);
      expect(company.aliases.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate tickers", () => {
    const tickers = TRACKED_COMPANIES.map((c) => c.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });
});
