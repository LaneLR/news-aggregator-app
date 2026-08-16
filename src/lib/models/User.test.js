import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
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

  // beforeCreate/beforeUpdate only run bcrypt hashing and in-memory dirty
  // tracking, neither of which needs a real DB connection, so they're
  // invoked directly here (Sequelize registers them under
  // Model.options.hooks[name] as an array) rather than left completely
  // untested, which they were before — dbMock.js-based route tests stub out
  // User.create()/update() entirely, so they never actually exercise this
  // hook logic.
  describe("beforeCreate hook", () => {
    it("generates an 8-character uppercase referral code", async () => {
      const user = User.build({ email: "test@example.com" });
      await User.options.hooks.beforeCreate[0](user, {});
      // nanoid's default alphabet includes "-"/"_" alongside alphanumerics,
      // so a real generated code can occasionally contain one — only
      // length and "no lowercase letters snuck in" are guaranteed.
      expect(user.referralCode).toHaveLength(8);
      expect(user.referralCode).toBe(user.referralCode.toUpperCase());
    });

    it("hashes a provided password", async () => {
      const user = User.build({ email: "test@example.com", password: "plaintext-pw" });
      await User.options.hooks.beforeCreate[0](user, {});

      expect(user.password).not.toBe("plaintext-pw");
      await expect(bcrypt.compare("plaintext-pw", user.password)).resolves.toBe(true);
    });

    it("leaves password as null for a Google-only signup with no password", async () => {
      const user = User.build({ email: "test@example.com", password: null });
      await User.options.hooks.beforeCreate[0](user, {});
      expect(user.password).toBeNull();
    });
  });

  describe("beforeUpdate hook", () => {
    it("re-hashes the password when it was changed", async () => {
      const user = User.build(
        { email: "test@example.com", password: "old-hash" },
        { isNewRecord: false, raw: true }
      );
      user.password = "new-plaintext-pw";
      expect(user.changed("password")).toBe(true);

      await User.options.hooks.beforeUpdate[0](user, {});

      expect(user.password).not.toBe("new-plaintext-pw");
      await expect(bcrypt.compare("new-plaintext-pw", user.password)).resolves.toBe(true);
    });

    it("leaves the password untouched when a different field changed", async () => {
      const existingHash = await bcrypt.hash("unchanged", 10);
      const user = User.build(
        { email: "test@example.com", password: existingHash },
        { isNewRecord: false, raw: true }
      );
      user.name = "New Name";
      expect(user.changed("password")).toBe(false);

      await User.options.hooks.beforeUpdate[0](user, {});

      expect(user.password).toBe(existingHash);
    });
  });

  describe("afterCreate hook", () => {
    it("creates a default 'Saved for later' archive in the same transaction as the insert", async () => {
      const user = User.build({ email: "test@example.com" });
      const mockFindOrCreate = vi.fn().mockResolvedValue([{}, true]);
      sequelize.models.Archive = { findOrCreate: mockFindOrCreate };
      const transaction = { fake: "transaction" };

      await User.options.hooks.afterCreate[0](user, { transaction });

      expect(mockFindOrCreate).toHaveBeenCalledWith({
        where: { name: "Saved for later", userId: user.id },
        transaction,
      });
    });
  });
});
