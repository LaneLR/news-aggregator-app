import { describe, expect, it } from "vitest";
import defineSavedArticle from "./SavedArticle";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const SavedArticle = defineSavedArticle(sequelize);

function validSavedArticle(overrides = {}) {
  return SavedArticle.build({
    title: "Headline",
    url: "https://example.com/a",
    archiveId: 1,
    ...overrides,
  });
}

describe("SavedArticle model", () => {
  it("passes validation with the required fields present", async () => {
    await expect(validSavedArticle().validate()).resolves.toBeDefined();
  });

  it("fails validation when title is missing", async () => {
    const saved = SavedArticle.build({ url: "https://example.com/a", archiveId: 1 });
    await expect(saved.validate()).rejects.toThrow();
  });

  it("fails validation when url is missing", async () => {
    const saved = SavedArticle.build({ title: "Headline", archiveId: 1 });
    await expect(saved.validate()).rejects.toThrow();
  });

  it("fails validation when archiveId is missing", async () => {
    const saved = SavedArticle.build({ title: "Headline", url: "https://example.com/a" });
    await expect(saved.validate()).rejects.toThrow();
  });

  it("allows optional fields to be omitted", () => {
    const saved = validSavedArticle();
    // No defaultValue is declared for these, so an unset attribute is
    // undefined (not null) until it round-trips through an actual query.
    expect(saved.urlToImage).toBeUndefined();
    expect(saved.sourceName).toBeUndefined();
  });
});
