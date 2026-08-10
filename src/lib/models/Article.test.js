import { describe, expect, it } from "vitest";
import defineArticle from "./Article";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const Article = defineArticle(sequelize);

describe("Article model", () => {
  it("applies default values on build", () => {
    const article = Article.build({
      title: "Headline",
      url: "https://example.com/a",
    });
    expect(article.sourceType).toBe("news");
    expect(article.likeCount).toBe(0);
    expect(article.clickCount).toBe(0);
    // No defaultValue is declared for `content`, so an unset attribute is
    // undefined (not null) until it round-trips through an actual query.
    expect(article.content).toBeUndefined();
  });

  it("passes validation with the required fields present", async () => {
    const article = Article.build({
      title: "Headline",
      url: "https://example.com/a",
    });
    await expect(article.validate()).resolves.toBeDefined();
  });

  it("fails validation when title is missing", async () => {
    const article = Article.build({ url: "https://example.com/a" });
    await expect(article.validate()).rejects.toThrow();
  });

  it("fails validation when url is missing", async () => {
    const article = Article.build({ title: "Headline" });
    await expect(article.validate()).rejects.toThrow();
  });

  it("accepts an explicit sourceType other than the default", () => {
    const article = Article.build({
      title: "Headline",
      url: "https://example.com/a",
      sourceType: "podcast",
    });
    expect(article.sourceType).toBe("podcast");
  });
});
