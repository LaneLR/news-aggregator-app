import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";

// Like migrateArticles.mjs, seed() runs immediately at import time rather
// than being exported, so each test re-imports the module fresh (via
// vi.resetModules()) against a mocked @/lib/db and polls for completion.
const mockFindOrCreate = vi.fn();
const mockClose = vi.fn();

vi.mock("@/lib/db", () => ({
  default: vi.fn(async () => ({ User: { findOrCreate: mockFindOrCreate }, sequelize: { close: mockClose } })),
}));

function makeUserRecord(overrides = {}) {
  return {
    email: "unset@example.com",
    tier: "Free",
    emailIsVerified: false,
    status: "inactive",
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("seedUsers.mjs", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    mockFindOrCreate.mockReset();
    mockClose.mockReset().mockResolvedValue(undefined);
    // process.exit really does terminate Node synchronously in production;
    // mocking it as a no-op here means execution can fall through past it
    // in ways real Node never would, but it's necessary so a non-development
    // NODE_ENV test case doesn't kill the whole test worker.
    vi.spyOn(process, "exit").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("refuses to run and exits when NODE_ENV is not 'development'", async () => {
    process.env.NODE_ENV = "production";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Even though process.exit is mocked, guard against unmocked fallthrough
    // actually reaching the DB by leaving findOrCreate unresolved-safe.
    mockFindOrCreate.mockResolvedValue([makeUserRecord(), true]);

    await import("./seedUsers.mjs");

    await waitFor(() => expect(process.exit).toHaveBeenCalledWith(1));
    expect(errorSpy.mock.calls.flat().join(" ")).toMatch(/Refusing to seed/);
  });

  it("creates new demo accounts and logs 'Created' when they don't already exist", async () => {
    process.env.NODE_ENV = "development";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const subscriber = makeUserRecord({ email: "abc123@email.com" });
    const freeUser = makeUserRecord({ email: "free-test@email.com" });
    mockFindOrCreate.mockResolvedValueOnce([subscriber, true]).mockResolvedValueOnce([freeUser, true]);

    await import("./seedUsers.mjs");

    await waitFor(() => expect(mockClose).toHaveBeenCalled());
    expect(subscriber.save).not.toHaveBeenCalled();
    expect(freeUser.save).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join(" ")).toMatch(/Created abc123@email.com/);
    expect(logSpy.mock.calls.flat().join(" ")).toMatch(/Created free-test@email.com/);
  });

  it("resets existing demo accounts to a known-good state and logs 'Reset'", async () => {
    process.env.NODE_ENV = "development";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const subscriber = makeUserRecord({ email: "abc123@email.com" });
    const freeUser = makeUserRecord({ email: "free-test@email.com" });
    mockFindOrCreate.mockResolvedValueOnce([subscriber, false]).mockResolvedValueOnce([freeUser, false]);

    await import("./seedUsers.mjs");

    await waitFor(() => expect(mockClose).toHaveBeenCalled());
    expect(subscriber.tier).toBe("Subscribed");
    expect(subscriber.emailIsVerified).toBe(true);
    expect(subscriber.status).toBe("active");
    expect(subscriber.save).toHaveBeenCalled();
    expect(freeUser.tier).toBe("Free");
    expect(freeUser.save).toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join(" ")).toMatch(/Reset existing account: abc123@email.com/);
  });
});
