import { describe, expect, it } from "vitest";
import defineUser from "./User";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

// See modelTestUtils.js: Model.init()/Model.build() work against a
// disconnected Sequelize instance (no real query is issued), which is
// enough to exercise defaults, setters, and built-in validators without a
// live DB connection.
const sequelize = createDisconnectedSequelize();
const User = defineUser(sequelize);

describe("User model", () => {
  it("applies default values on build", () => {
    const user = User.build({ email: "test@example.com" });
    expect(user.tier).toBe("Free");
    expect(user.status).toBe("active");
    expect(user.emailIsVerified).toBe(false);
    expect(user.digestFrequency).toBe("weekly");
    expect(user.mutedKeywords).toEqual([]);
    expect(user.followedKeywords).toEqual([]);
    expect(user.viewDensity).toBe("reader");
  });

  it("lowercases email via the custom setter", () => {
    const user = User.build({ email: "MixedCase@Example.COM" });
    expect(user.email).toBe("mixedcase@example.com");
  });

  it("fails validation for a malformed email", async () => {
    const user = User.build({ email: "not-an-email" });
    await expect(user.validate()).rejects.toThrow();
  });

  it("passes validation for a well-formed user", async () => {
    const user = User.build({ email: "valid@example.com" });
    await expect(user.validate()).resolves.toBeDefined();
  });

  it("validatePassword compares against the stored hash", async () => {
    const user = User.build({ email: "test@example.com" });
    // Simulate a pre-hashed password the way beforeCreate/beforeUpdate would
    // produce it — .build() alone doesn't run creation hooks.
    const bcrypt = await import("bcryptjs");
    user.password = await bcrypt.hash("correct-horse", 10);

    await expect(user.validatePassword("correct-horse")).resolves.toBe(true);
    await expect(user.validatePassword("wrong-password")).resolves.toBe(false);
  });

  // Note: ENUM range-checking (tier can only be "Free"/"Subscribed") is
  // enforced by a Postgres CHECK constraint at actual query time, not by
  // Sequelize's in-memory `.validate()` — so it can't be exercised here
  // without a live connection (see modelTestUtils.js's own limits comment).
});
