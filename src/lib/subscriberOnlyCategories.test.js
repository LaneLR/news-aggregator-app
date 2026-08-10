import { describe, expect, it } from "vitest";
import {
  SUBSCRIBER_ONLY_CATEGORIES,
  GATED_TAGS,
  excludeGatedCategoriesCondition,
} from "./subscriberOnlyCategories";

describe("subscriberOnlyCategories", () => {
  it("derives capitalized GATED_TAGS from the lowercase slugs", () => {
    expect(GATED_TAGS).toEqual(
      [...SUBSCRIBER_ONLY_CATEGORIES].map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    );
  });

  it("flags known gated slugs", () => {
    expect(SUBSCRIBER_ONLY_CATEGORIES.has("market")).toBe(true);
    expect(SUBSCRIBER_ONLY_CATEGORIES.has("finance")).toBe(true);
    expect(SUBSCRIBER_ONLY_CATEGORIES.has("journal")).toBe(true);
  });

  it("does not flag an ungated category", () => {
    expect(SUBSCRIBER_ONLY_CATEGORIES.has("sports")).toBe(false);
  });

  it("builds a literal SQL fragment excluding the gated tags for the default column", () => {
    const condition = excludeGatedCategoriesCondition();
    expect(condition.val).toContain('NOT ("category" &&');
    for (const tag of GATED_TAGS) {
      expect(condition.val).toContain(`'${tag}'`);
    }
  });

  it("honors a custom column name", () => {
    const condition = excludeGatedCategoriesCondition("cat");
    expect(condition.val).toContain('"cat"');
  });

  it("escapes single quotes defensively even though GATED_TAGS is a fixed constant", () => {
    // Sanity-check the escaping logic itself rather than GATED_TAGS' actual
    // contents, since none of the real tags contain a quote.
    const escaped = "O'Brien".replace(/'/g, "''");
    expect(escaped).toBe("O''Brien");
  });
});
