import { describe, expect, it } from "vitest";
import { getCategoryColor } from "./categoryColors";

describe("getCategoryColor", () => {
  it("returns the mapped color for a known category", () => {
    expect(getCategoryColor("Business")).toBe("#15803d");
    expect(getCategoryColor("Tech")).toBe("#2e5ce6");
  });

  it("treats 'Technology' as an alias for 'Tech'", () => {
    expect(getCategoryColor("Technology")).toBe(getCategoryColor("Tech"));
  });

  it("falls back to the default color for an unknown category", () => {
    expect(getCategoryColor("NotACategory")).toBe("#334155");
  });

  it("falls back to the default color for undefined/empty input", () => {
    expect(getCategoryColor(undefined)).toBe("#334155");
    expect(getCategoryColor("")).toBe("#334155");
  });
});
