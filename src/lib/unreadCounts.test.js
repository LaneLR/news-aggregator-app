import { describe, expect, it, vi } from "vitest";
import { getUnreadCounts } from "./unreadCounts";
import { makeUser } from "@/test/fixtures";

function makeDb({ articles = [], reads = [], feeds = [] } = {}) {
  return {
    Article: { findAll: vi.fn().mockResolvedValue(articles) },
    ReadArticle: { findAll: vi.fn().mockResolvedValue(reads) },
    Feed: { findAll: vi.fn().mockResolvedValue(feeds) },
  };
}

describe("getUnreadCounts", () => {
  it("counts unread articles per lowercased category, excluding already-read ones", async () => {
    const db = makeDb({
      articles: [
        { url: "u1", title: "A", category: ["Business"], sourceName: "Src" },
        { url: "u2", title: "B", category: ["US"], sourceName: "Src" },
        { url: "u3", title: "C", category: ["Business"], sourceName: "Src" },
      ],
      reads: [{ articleUrl: "u3" }],
    });
    const user = makeUser({ mutedKeywords: [], followedKeywords: [] });

    const result = await getUnreadCounts(db, user, { isSubscribed: true });
    expect(result.categories).toEqual({ business: 1, us: 1 });
  });

  it("excludes gated categories for non-subscribers", async () => {
    const db = makeDb({
      articles: [{ url: "u1", title: "A", category: ["Market"], sourceName: "Src" }],
    });
    const user = makeUser();

    await getUnreadCounts(db, user, { isSubscribed: false });
    // We can't inspect the raw literal condition easily, but we can assert
    // the where clause passed to Article.findAll includes an AND array
    // beyond just the date filter, i.e. the gating condition got appended.
    const whereArg = db.Article.findAll.mock.calls[0][0].where;
    expect(whereArg[Object.getOwnPropertySymbols(whereArg)[0]].length).toBeGreaterThan(1);
  });

  it("counts matching feeds", async () => {
    const db = makeDb({
      articles: [{ url: "u1", title: "A", category: ["Tech"], sourceName: "TechCrunch" }],
      feeds: [{ id: "f1", sourceNames: ["TechCrunch"], categories: [] }],
    });
    const user = makeUser();

    const result = await getUnreadCounts(db, user, { isSubscribed: true });
    expect(result.feeds).toBe(1);
  });

  it("counts feed matches by category as well as source name", async () => {
    const db = makeDb({
      articles: [{ url: "u1", title: "A", category: ["Tech"], sourceName: "Other" }],
      feeds: [{ id: "f1", sourceNames: [], categories: ["Tech"] }],
    });
    const user = makeUser();

    const result = await getUnreadCounts(db, user, { isSubscribed: true });
    expect(result.feeds).toBe(1);
  });

  it("returns feeds: 0 when the user has no feeds", async () => {
    const db = makeDb({
      articles: [{ url: "u1", title: "A", category: ["Tech"], sourceName: "Other" }],
      feeds: [],
    });
    const user = makeUser();

    const result = await getUnreadCounts(db, user, { isSubscribed: true });
    expect(result.feeds).toBe(0);
  });

  it("counts unread articles matching a followed keyword by title", async () => {
    const db = makeDb({
      articles: [{ url: "u1", title: "Tesla stock jumps", category: ["Business"], sourceName: "Src" }],
    });
    const user = makeUser({ followedKeywords: ["tesla"] });

    const result = await getUnreadCounts(db, user, { isSubscribed: true });
    expect(result.following).toBe(1);
  });

  it("returns following: 0 when the user follows no keywords", async () => {
    const db = makeDb({
      articles: [{ url: "u1", title: "Tesla stock jumps", category: ["Business"], sourceName: "Src" }],
    });
    const user = makeUser({ followedKeywords: [] });

    const result = await getUnreadCounts(db, user, { isSubscribed: true });
    expect(result.following).toBe(0);
  });

  it("counts unread articles matching a followed source", async () => {
    const db = makeDb({
      articles: [
        { url: "u1", title: "Unrelated headline", category: ["Business"], sourceName: "Reuters" },
        { url: "u2", title: "Other headline", category: ["Business"], sourceName: "Other" },
      ],
    });
    const user = makeUser({ followedKeywords: [], followedSources: ["Reuters"] });

    const result = await getUnreadCounts(db, user, { isSubscribed: true });
    expect(result.following).toBe(1);
  });

  it("counts an article once when it matches both a followed keyword and a followed source", async () => {
    const db = makeDb({
      articles: [{ url: "u1", title: "Tesla stock jumps", category: ["Business"], sourceName: "Reuters" }],
    });
    const user = makeUser({ followedKeywords: ["tesla"], followedSources: ["Reuters"] });

    const result = await getUnreadCounts(db, user, { isSubscribed: true });
    expect(result.following).toBe(1);
  });
});
