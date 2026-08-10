import { describe, expect, it } from "vitest";
import defineArticleLike from "./ArticleLike";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const ArticleLike = defineArticleLike(sequelize);

describe("ArticleLike model", () => {
  it("passes validation with both key fields present", async () => {
    const like = ArticleLike.build({ userId: "user-1", articleUrl: "https://example.com/a" });
    await expect(like.validate()).resolves.toBeDefined();
  });

  it("fails validation when userId is missing", async () => {
    const like = ArticleLike.build({ articleUrl: "https://example.com/a" });
    await expect(like.validate()).rejects.toThrow();
  });

  it("fails validation when articleUrl is missing", async () => {
    const like = ArticleLike.build({ userId: "user-1" });
    await expect(like.validate()).rejects.toThrow();
  });
});
