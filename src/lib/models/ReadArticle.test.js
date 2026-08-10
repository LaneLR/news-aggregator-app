import { describe, expect, it } from "vitest";
import defineReadArticle from "./ReadArticle";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const ReadArticle = defineReadArticle(sequelize);

describe("ReadArticle model", () => {
  it("passes validation with both key fields present", async () => {
    const read = ReadArticle.build({ userId: "user-1", articleUrl: "https://example.com/a" });
    await expect(read.validate()).resolves.toBeDefined();
  });

  it("fails validation when userId is missing", async () => {
    const read = ReadArticle.build({ articleUrl: "https://example.com/a" });
    await expect(read.validate()).rejects.toThrow();
  });

  it("fails validation when articleUrl is missing", async () => {
    const read = ReadArticle.build({ userId: "user-1" });
    await expect(read.validate()).rejects.toThrow();
  });
});
