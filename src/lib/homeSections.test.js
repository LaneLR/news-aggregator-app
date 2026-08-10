import { describe, expect, it } from "vitest";
import {
  CATEGORY_SECTION_TAGS,
  HERO_SECTION_KEYS,
  ALL_SECTION_KEYS,
  DEFAULT_HOME_SECTIONS,
} from "./homeSections";

describe("homeSections constants", () => {
  it("combines hero keys and category tags into ALL_SECTION_KEYS", () => {
    expect(ALL_SECTION_KEYS).toEqual([...HERO_SECTION_KEYS, ...CATEGORY_SECTION_TAGS]);
  });

  it("only includes default sections that are valid section keys", () => {
    for (const section of DEFAULT_HOME_SECTIONS) {
      expect(ALL_SECTION_KEYS).toContain(section);
    }
  });

  it("includes both hero rows in the defaults", () => {
    expect(DEFAULT_HOME_SECTIONS).toEqual(expect.arrayContaining(HERO_SECTION_KEYS));
  });
});
