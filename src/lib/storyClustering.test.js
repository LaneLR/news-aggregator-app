import { describe, expect, it, vi } from "vitest";
import { getRelatedCoverage, clusterArticles } from "./storyClustering";

describe("getRelatedCoverage", () => {
  it("returns an empty array when the target article has no category", async () => {
    const Article = { findAll: vi.fn() };
    const result = await getRelatedCoverage(Article, { id: "1", title: "x", category: [] });
    expect(result).toEqual([]);
    expect(Article.findAll).not.toHaveBeenCalled();
  });

  it("returns candidates whose title overlaps significantly with the target", async () => {
    const target = { id: "1", title: "Federal Reserve raises interest rates sharply", category: ["Business"] };
    const candidate = { id: "2", title: "Federal Reserve raises interest rates again", category: ["Business"] };
    const Article = { findAll: vi.fn().mockResolvedValue([candidate]) };

    const result = await getRelatedCoverage(Article, target);
    expect(result).toEqual([candidate]);
  });

  it("excludes candidates below the similarity threshold", async () => {
    const target = { id: "1", title: "Federal Reserve raises interest rates", category: ["Business"] };
    const unrelated = { id: "2", title: "Local bakery wins award for best pie", category: ["Business"] };
    const Article = { findAll: vi.fn().mockResolvedValue([unrelated]) };

    const result = await getRelatedCoverage(Article, target);
    expect(result).toEqual([]);
  });

  it("caps results at the given limit", async () => {
    const target = { id: "1", title: "Stock market rallies on earnings news", category: ["Business"] };
    const candidates = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      title: "Stock market rallies on earnings news today",
      category: ["Business"],
    }));
    const Article = { findAll: vi.fn().mockResolvedValue(candidates) };

    const result = await getRelatedCoverage(Article, target, 3);
    expect(result.length).toBe(3);
  });
});

describe("clusterArticles", () => {
  it("groups similar same-category articles into a cluster", () => {
    const articles = [
      { title: "Federal Reserve raises interest rates sharply", category: ["Business"] },
      { title: "Federal Reserve raises interest rates again", category: ["Business"] },
      { title: "Local bakery wins award for best pie", category: ["Food"] },
    ];

    const clusters = clusterArticles(articles);
    expect(clusters.length).toBe(1);
    expect(clusters[0].length).toBe(2);
  });

  it("does not cluster similar-titled articles from different categories", () => {
    const articles = [
      { title: "Federal Reserve raises interest rates sharply", category: ["Business"] },
      { title: "Federal Reserve raises interest rates sharply", category: ["Politics"] },
    ];
    const clusters = clusterArticles(articles);
    expect(clusters).toEqual([]);
  });

  it("returns no clusters when nothing is similar enough (singletons dropped)", () => {
    const articles = [
      { title: "Completely unrelated headline one", category: ["World"] },
      { title: "Totally different topic entirely", category: ["World"] },
    ];
    expect(clusterArticles(articles)).toEqual([]);
  });

  it("caps the number of clusters at maxClusters, largest first", () => {
    const articles = [];
    for (let i = 0; i < 5; i++) {
      articles.push({ title: `Topic Alpha number ${i} breaking story`, category: ["A"] });
      articles.push({ title: `Topic Alpha number ${i} breaking story`, category: ["A"] });
    }
    const clusters = clusterArticles(articles, { maxClusters: 2 });
    expect(clusters.length).toBeLessThanOrEqual(2);
  });
});
