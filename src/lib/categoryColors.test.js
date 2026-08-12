import { describe, expect, it } from "vitest";
import { getCategoryColor, getCategoryPlaceholderImage } from "./categoryColors";

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

describe("getCategoryPlaceholderImage", () => {
  it("returns the category-specific placeholder for a known category", () => {
    expect(getCategoryPlaceholderImage("Business")).toBe("/images/placeholders/business.png");
    expect(getCategoryPlaceholderImage("Entertainment")).toBe("/images/placeholders/entertainment.png");
  });

  it("lowercases the category to build the filename", () => {
    expect(getCategoryPlaceholderImage("US")).toBe("/images/placeholders/us.png");
  });

  it("falls back to the generic default for an unknown category", () => {
    expect(getCategoryPlaceholderImage("NotACategory")).toBe("/images/blurimage.png");
  });

  it("falls back to the generic default for null/undefined input", () => {
    expect(getCategoryPlaceholderImage(null)).toBe("/images/blurimage.png");
    expect(getCategoryPlaceholderImage(undefined)).toBe("/images/blurimage.png");
  });
});
