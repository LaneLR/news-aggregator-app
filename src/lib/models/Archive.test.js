import { describe, expect, it } from "vitest";
import defineArchive from "./Archive";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const sequelize = createDisconnectedSequelize();
const Archive = defineArchive(sequelize);

describe("Archive model", () => {
  it("applies default values on build", () => {
    const archive = Archive.build({ name: "Saved for later", userId: "user-1" });
    expect(archive.isPublic).toBe(false);
    expect(archive.publicSlug).toBeUndefined();
  });

  it("passes validation with the required fields present", async () => {
    const archive = Archive.build({ name: "Saved for later", userId: "user-1" });
    await expect(archive.validate()).resolves.toBeDefined();
  });

  it("fails validation when name is missing", async () => {
    const archive = Archive.build({ userId: "user-1" });
    await expect(archive.validate()).rejects.toThrow();
  });

  it("fails validation when userId is missing", async () => {
    const archive = Archive.build({ name: "Saved for later" });
    await expect(archive.validate()).rejects.toThrow();
  });
});
