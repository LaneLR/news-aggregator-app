import { describe, expect, it } from "vitest";
import { TRACKED_INDICES } from "./marketIndices";

describe("TRACKED_INDICES", () => {
  it("gives every entry a symbol, displayName, and sortOrder", () => {
    for (const index of TRACKED_INDICES) {
      expect(index.symbol).toBeTruthy();
      expect(index.displayName).toBeTruthy();
      expect(typeof index.sortOrder).toBe("number");
    }
  });

  it("has unique, sequential sortOrder values", () => {
    const orders = TRACKED_INDICES.map((i) => i.sortOrder).sort((a, b) => a - b);
    expect(orders).toEqual(TRACKED_INDICES.map((_, i) => i));
  });
});
