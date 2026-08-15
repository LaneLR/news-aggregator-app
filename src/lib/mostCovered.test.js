import { describe, expect, it, vi } from "vitest";
import { getMostCoveredCompanies } from "./mostCovered";

function makeArticleModel(articles) {
  return {
    findAll: vi.fn().mockResolvedValue(articles),
    // getMostCoveredCompanies orders via src/lib/dbOrder.js's orderByDesc,
    // which reads the bound Sequelize instance off the model itself.
    sequelize: { literal: vi.fn((sql) => ({ __literal: sql })) },
  };
}

describe("getMostCoveredCompanies", () => {
  it("returns an empty list when no tracked company is mentioned", async () => {
    const Article = makeArticleModel([
      { id: "1", title: "Local weather turns cold", url: "u1", publishedAt: new Date() },
    ]);
    const result = await getMostCoveredCompanies(Article);
    expect(result).toEqual([]);
  });

  it("counts title mentions per company and sorts descending by count", async () => {
    const Article = makeArticleModel([
      { id: "1", title: "Apple unveils new iPhone", url: "u1", publishedAt: new Date() },
      { id: "2", title: "Apple stock rises on earnings", url: "u2", publishedAt: new Date() },
      { id: "3", title: "Tesla delivers record cars", url: "u3", publishedAt: new Date() },
    ]);

    const result = await getMostCoveredCompanies(Article);
    expect(result[0]).toMatchObject({ name: "Apple", ticker: "AAPL", count: 2 });
    expect(result[1]).toMatchObject({ name: "Tesla", ticker: "TSLA", count: 1 });
  });

  it("matches word-boundary aliases only, not partial substrings", async () => {
    const Article = makeArticleModel([
      { id: "1", title: "Applesauce recipe goes viral", url: "u1", publishedAt: new Date() },
    ]);
    const result = await getMostCoveredCompanies(Article);
    expect(result).toEqual([]);
  });

  it("captures the first (most recent) matching article's id/title/url", async () => {
    const Article = makeArticleModel([
      { id: "newer", title: "Tesla unveils robotaxi", url: "u-newer", publishedAt: new Date() },
      { id: "older", title: "Tesla recalls vehicles", url: "u-older", publishedAt: new Date() },
    ]);
    const [top] = await getMostCoveredCompanies(Article);
    expect(top.articleId).toBe("newer");
    expect(top.articleUrl).toBe("u-newer");
  });

  it("limits results to the top 8 companies", async () => {
    const articles = [
      "Apple", "Microsoft", "Amazon", "Google", "Meta", "Tesla", "Nvidia", "Netflix",
      "IBM", "Oracle",
    ].map((name, i) => ({ id: String(i), title: `${name} makes headlines`, url: `u${i}`, publishedAt: new Date() }));
    const Article = makeArticleModel(articles);
    const result = await getMostCoveredCompanies(Article);
    expect(result.length).toBeLessThanOrEqual(8);
  });
});
