import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeUser } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db.js", () => ({ default: vi.fn(async () => db) }));

const mockNextAuth = vi.fn();
vi.mock("next-auth", () => {
  // Mirrors @auth/core/errors' real CredentialsSignin shape closely enough
  // for this file's `class Foo extends CredentialsSignin { code = "x" }`
  // subclasses and the assertions below (message/name), without pulling in
  // next-auth's full runtime (which imports "next/server" and fails outside
  // an actual Next.js module resolution context).
  class CredentialsSignin extends Error {
    constructor(message) {
      super(message);
      this.name = "CredentialsSignin";
      this.type = "CredentialsSignin";
    }
  }
  return {
    default: (config) => {
      mockNextAuth(config);
      return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
    },
    CredentialsSignin,
  };
});

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

// Real authRateLimitMiddleware tracks state per-IP at module scope, so
// several authorize() calls in this file (all with no real request/IP)
// would trip its 5-per-minute limit against each other — mock it the same
// way every other auth-adjacent route test does.
const mockRateLimit = vi.fn(async () => {});
vi.mock("@/lib/rate-limiter", () => ({
  authRateLimitMiddleware: (...args) => mockRateLimit(...args),
}));

await import("./auth.js");
const config = mockNextAuth.mock.calls[0][0];
// The real CredentialsProvider() (unmocked here — see the docblock note in
// node_modules/@auth/core/providers/credentials.js) always sets its own
// top-level `authorize: () => null` stub and stashes the actual object we
// passed in (including our real authorize function) under `.options`
// instead — NextAuth's runtime re-reads it from there when building the
// real handler. Since we're inspecting the raw provider config directly
// (bypassing that runtime), we must call `.options.authorize`, not
// `.authorize`, to reach the function this file actually defines.
const credentialsProvider = config.providers.find((p) => p.id === "credentials");
const authorize = credentialsProvider.options.authorize;
const bcrypt = (await import("bcryptjs")).default;

function dbUser(overrides = {}) {
  return createInstanceMock(makeUser(overrides));
}

describe("auth.js NextAuth config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockReset();
    mockRateLimit.mockResolvedValue(undefined);
  });

  describe("credentials authorize() rate limiting", () => {
    it("throws TooManyAttemptsError when the rate limiter rejects", async () => {
      const rateLimitError = new Error("Too many requests");
      rateLimitError.status = 429;
      mockRateLimit.mockRejectedValueOnce(rateLimitError);

      await expect(
        authorize({ email: "a@example.com", password: "x" }, {})
      ).rejects.toMatchObject({ code: "too-many-attempts" });
      expect(db.User.findOne).not.toHaveBeenCalled();
    });
  });

  describe("credentials authorize()", () => {
    it("throws NoAccountError when no user matches the email", async () => {
      db.User.findOne.mockResolvedValueOnce(null);
      await expect(
        authorize({ email: "nobody@example.com", password: "x" })
      ).rejects.toMatchObject({ code: "no-account" });
    });

    it("throws AccountInactiveError for an inactive account", async () => {
      db.User.findOne.mockResolvedValueOnce(dbUser({ status: "inactive" }));
      await expect(
        authorize({ email: "a@example.com", password: "x" })
      ).rejects.toMatchObject({ code: "account-inactive" });
    });

    it("throws GoogleOnlyAccountError when the user has no password set", async () => {
      db.User.findOne.mockResolvedValueOnce(dbUser({ password: null }));
      await expect(
        authorize({ email: "a@example.com", password: "x" })
      ).rejects.toMatchObject({ code: "google-only" });
    });

    it("throws InvalidPasswordError when bcrypt.compare fails", async () => {
      db.User.findOne.mockResolvedValueOnce(dbUser({ password: "hashed" }));
      bcrypt.compare.mockResolvedValueOnce(false);
      await expect(
        authorize({ email: "a@example.com", password: "wrong" })
      ).rejects.toMatchObject({ code: "invalid-password" });
    });

    it("throws EmailNotVerifiedError when the password is valid but email unverified", async () => {
      db.User.findOne.mockResolvedValueOnce(
        dbUser({ password: "hashed", emailIsVerified: false })
      );
      bcrypt.compare.mockResolvedValueOnce(true);
      await expect(
        authorize({ email: "a@example.com", password: "correct" })
      ).rejects.toMatchObject({ code: "email-not-verified" });
    });

    it("returns a projected user object on success", async () => {
      const user = dbUser({ password: "hashed", emailIsVerified: true, tier: "Subscribed" });
      db.User.findOne.mockResolvedValueOnce(user);
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await authorize({ email: user.email, password: "correct" });
      expect(result).toMatchObject({ id: user.id, email: user.email, tier: "Subscribed" });
    });
  });

  describe("signIn callback", () => {
    it("returns false when no dbUser exists and the provider isn't google", async () => {
      db.User.findOne.mockResolvedValueOnce(null);
      const user = {};
      const result = await config.callbacks.signIn({ user, account: { provider: "credentials" } });
      expect(result).toBe(false);
    });

    it("auto-creates a User row for a first-time google sign-in", async () => {
      db.User.findOne.mockResolvedValueOnce(null);
      const created = dbUser({ email: "new@example.com", name: "New User" });
      db.User.create.mockResolvedValueOnce(created);

      const user = { email: "new@example.com", name: "New User", image: null };
      const result = await config.callbacks.signIn({ user, account: { provider: "google" } });

      expect(db.User.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@example.com", emailIsVerified: true })
      );
      expect(result).toBe(true);
      expect(user.id).toBe(created.id);
    });

    it("redirects inactive accounts to a login error page instead of proceeding", async () => {
      db.User.findOne.mockResolvedValueOnce(dbUser({ status: "inactive" }));
      const result = await config.callbacks.signIn({
        user: {},
        account: { provider: "credentials" },
      });
      expect(result).toBe("/login?error=AccountInactive");
    });

    it("populates the incoming user object from the dbUser on success", async () => {
      const existing = dbUser({ tier: "Subscribed", status: "active" });
      db.User.findOne.mockResolvedValueOnce(existing);
      const user = {};
      const result = await config.callbacks.signIn({
        user,
        account: { provider: "credentials" },
      });
      expect(result).toBe(true);
      expect(user.tier).toBe("Subscribed");
      expect(user.id).toBe(existing.id);
    });

    it("returns false and logs when the DB lookup throws", async () => {
      db.User.findOne.mockRejectedValueOnce(new Error("db down"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await config.callbacks.signIn({
        user: {},
        account: { provider: "credentials" },
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("jwt callback", () => {
    it("copies fields from `user` onto the token on initial sign-in", async () => {
      const user = makeUser({ tier: "Subscribed" });
      const token = {};
      const result = await config.callbacks.jwt({ token, user });
      expect(result.tier).toBe("Subscribed");
      expect(result.id).toBe(user.id);
    });

    it("re-fetches the user from the DB on subsequent calls (no `user` arg)", async () => {
      const dbRow = dbUser({ tier: "Subscribed" });
      db.User.findByPk.mockResolvedValueOnce(dbRow);
      const token = { id: dbRow.id };
      const result = await config.callbacks.jwt({ token });
      expect(result.tier).toBe("Subscribed");
      expect(db.User.findByPk).toHaveBeenCalledWith(dbRow.id);
    });

    it("returns null when the token's user no longer exists", async () => {
      db.User.findByPk.mockResolvedValueOnce(null);
      const result = await config.callbacks.jwt({ token: { id: "gone" } });
      expect(result).toBeNull();
    });

    it("returns null when the token's user has gone inactive", async () => {
      db.User.findByPk.mockResolvedValueOnce(dbUser({ status: "inactive" }));
      const result = await config.callbacks.jwt({ token: { id: "u1" } });
      expect(result).toBeNull();
    });
  });

  describe("session callback", () => {
    it("projects token fields onto session.user", async () => {
      const token = {
        id: "u1",
        email: "a@example.com",
        name: "A",
        tier: "Subscribed",
        status: "active",
      };
      const session = { user: {} };
      const result = await config.callbacks.session({ session, token });
      expect(result.user.id).toBe("u1");
      expect(result.user.tier).toBe("Subscribed");
    });

    it("returns the session unchanged when there is no token", async () => {
      const session = { user: {} };
      const result = await config.callbacks.session({ session, token: null });
      expect(result).toBe(session);
      expect(result.user.id).toBeUndefined();
    });
  });
});
