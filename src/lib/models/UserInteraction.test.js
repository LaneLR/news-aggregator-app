import { describe, expect, it } from "vitest";
import defineUserInteraction from "./UserInteraction";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const UserInteraction = defineUserInteraction(sequelize);

describe("UserInteraction model", () => {
  it("passes validation with the required fields present", async () => {
    const interaction = UserInteraction.build({
      userId: "user-1",
      articleUrl: "https://example.com/a",
    });
    await expect(interaction.validate()).resolves.toBeDefined();
  });

  it("fails validation when userId is missing", async () => {
    const interaction = UserInteraction.build({ articleUrl: "https://example.com/a" });
    await expect(interaction.validate()).rejects.toThrow();
  });

  it("fails validation when articleUrl is missing", async () => {
    const interaction = UserInteraction.build({ userId: "user-1" });
    await expect(interaction.validate()).rejects.toThrow();
  });

  it("has no updatedAt column, since it's disabled in the model options", () => {
    expect(UserInteraction.rawAttributes).not.toHaveProperty("updatedAt");
    expect(UserInteraction.rawAttributes).toHaveProperty("createdAt");
  });

  it("stores optional denormalized sourceName/category fields", () => {
    const interaction = UserInteraction.build({
      userId: "user-1",
      articleUrl: "https://example.com/a",
      sourceName: "Reuters",
      category: ["Business"],
    });
    expect(interaction.sourceName).toBe("Reuters");
    expect(interaction.category).toEqual(["Business"]);
  });
});
