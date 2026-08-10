import { describe, expect, it } from "vitest";
import defineFeed from "./Feed";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const Feed = defineFeed(sequelize);

describe("Feed model", () => {
  it("applies default empty arrays on build", () => {
    const feed = Feed.build({ title: "My Feed" });
    expect(feed.sourceNames).toEqual([]);
    expect(feed.categories).toEqual([]);
  });

  it("passes validation with title present", async () => {
    const feed = Feed.build({ title: "My Feed" });
    await expect(feed.validate()).resolves.toBeDefined();
  });

  it("fails validation when title is missing", async () => {
    const feed = Feed.build({});
    await expect(feed.validate()).rejects.toThrow();
  });

  it("keeps explicit sourceNames/categories instead of the defaults", () => {
    const feed = Feed.build({
      title: "My Feed",
      sourceNames: ["Reuters"],
      categories: ["Business", "Tech"],
    });
    expect(feed.sourceNames).toEqual(["Reuters"]);
    expect(feed.categories).toEqual(["Business", "Tech"]);
  });
});
