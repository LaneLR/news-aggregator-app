import { describe, expect, it } from "vitest";
import { Op } from "sequelize";
import { buildKeywordExclusion, filterByMutedKeywords } from "./keywordFilter";

describe("buildKeywordExclusion", () => {
  it("returns null for no muted keywords", () => {
    expect(buildKeywordExclusion(null)).toBeNull();
    expect(buildKeywordExclusion(undefined)).toBeNull();
    expect(buildKeywordExclusion([])).toBeNull();
  });

  it("builds an AND'd notILike clause per keyword", () => {
    const clause = buildKeywordExclusion(["crypto", "election"]);
    expect(clause[Op.and]).toEqual([
      { title: { [Op.notILike]: "%crypto%" } },
      { title: { [Op.notILike]: "%election%" } },
    ]);
  });
});

describe("filterByMutedKeywords", () => {
  const articles = [
    { title: "Bitcoin surges past $100k" },
    { title: "Local weather update" },
    { title: "Election results are in" },
  ];

  it("returns the original list unchanged when there are no muted keywords", () => {
    expect(filterByMutedKeywords(articles, [])).toBe(articles);
    expect(filterByMutedKeywords(articles, null)).toBe(articles);
  });

  it("filters out articles whose title matches a muted keyword, case-insensitively", () => {
    const result = filterByMutedKeywords(articles, ["BITCOIN"]);
    expect(result).toEqual([
      { title: "Local weather update" },
      { title: "Election results are in" },
    ]);
  });

  it("filters against multiple keywords", () => {
    const result = filterByMutedKeywords(articles, ["bitcoin", "election"]);
    expect(result).toEqual([{ title: "Local weather update" }]);
  });

  it("handles articles with a missing title gracefully", () => {
    expect(filterByMutedKeywords([{ title: undefined }], ["x"])).toEqual([{ title: undefined }]);
  });
});
