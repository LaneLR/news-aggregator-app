import { describe, expect, it } from "vitest";
import { Op } from "sequelize";
import { buildKeywordInclusion } from "./followedKeywords";

describe("buildKeywordInclusion", () => {
  it("returns null when there are no followed keywords", () => {
    expect(buildKeywordInclusion([])).toBeNull();
    expect(buildKeywordInclusion(null)).toBeNull();
    expect(buildKeywordInclusion(undefined)).toBeNull();
  });

  it("builds an OR'd iLike clause per keyword", () => {
    const clause = buildKeywordInclusion(["tesla", "fed"]);
    expect(clause[Op.or]).toEqual([
      { title: { [Op.iLike]: "%tesla%" } },
      { title: { [Op.iLike]: "%fed%" } },
    ]);
  });

  it("matches on a single keyword", () => {
    const clause = buildKeywordInclusion(["tesla"]);
    expect(clause[Op.or]).toHaveLength(1);
  });
});
