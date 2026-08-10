import { describe, expect, it, vi, beforeEach } from "vitest";
import { createDisconnectedSequelize } from "@/test/modelTestUtils";

const mockGetSequelizeInstance = vi.fn();
vi.mock("./sequelize.js", () => ({
  default: (...args) => mockGetSequelizeInstance(...args),
}));

const MODEL_NAMES = [
  "User",
  "Archive",
  "SavedArticle",
  "Article",
  "Feed",
  "ArticleLike",
  "ProcessedStripeEvent",
  "UserInteraction",
  "ReadArticle",
  "MarketQuote",
  "MarketChartCache",
  "PushSubscription",
];

describe("initializeDbAndModels", () => {
  let sequelize;

  beforeEach(async () => {
    // Module-level singleton cache lives on globalThis, not on the module
    // itself, so it survives vi.resetModules() — reset it explicitly per
    // the task's guidance, alongside re-importing db.js fresh each test.
    global.db = {};
    vi.resetModules();
    sequelize = createDisconnectedSequelize();
    sequelize.sync = vi.fn().mockResolvedValue();
    mockGetSequelizeInstance.mockReset();
    mockGetSequelizeInstance.mockResolvedValue(sequelize);
  });

  it("attaches every model plus the sequelize instance onto global.db", async () => {
    const initializeDbAndModels = (await import("./db.js")).default;
    const db = await initializeDbAndModels();

    for (const name of MODEL_NAMES) {
      expect(db[name]).toBeDefined();
    }
    expect(db.sequelize).toBe(sequelize);
  });

  it("sets up the User<->Archive and Archive<->SavedArticle associations", async () => {
    const initializeDbAndModels = (await import("./db.js")).default;
    const db = await initializeDbAndModels();

    const userTargets = Object.values(db.User.associations).map((a) => a.target);
    expect(userTargets).toContain(db.Archive);
    expect(userTargets).toContain(db.Feed);
    expect(userTargets).toContain(db.ArticleLike);
    expect(userTargets).toContain(db.UserInteraction);
    expect(userTargets).toContain(db.ReadArticle);
    expect(userTargets).toContain(db.PushSubscription);

    const archiveTargets = Object.values(db.Archive.associations).map((a) => a.target);
    expect(archiveTargets).toContain(db.User);
    expect(archiveTargets).toContain(db.SavedArticle);
  });

  it("only calls getSequelizeInstance once across repeated calls (singleton)", async () => {
    const initializeDbAndModels = (await import("./db.js")).default;
    const first = await initializeDbAndModels();
    const second = await initializeDbAndModels();

    expect(mockGetSequelizeInstance).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first.User).toBe(second.User);
  });

  it("does not run schema sync when RUN_DB_SYNC is unset", async () => {
    vi.stubEnv("RUN_DB_SYNC", "");
    const initializeDbAndModels = (await import("./db.js")).default;
    await initializeDbAndModels();
    expect(sequelize.sync).not.toHaveBeenCalled();
  });

  it("runs schema sync with alter:true when RUN_DB_SYNC=true", async () => {
    vi.stubEnv("RUN_DB_SYNC", "true");
    const initializeDbAndModels = (await import("./db.js")).default;
    await initializeDbAndModels();
    expect(sequelize.sync).toHaveBeenCalledWith({ alter: true });
  });

  it("logs and rethrows when getting the Sequelize instance fails", async () => {
    mockGetSequelizeInstance.mockReset();
    mockGetSequelizeInstance.mockRejectedValueOnce(new Error("connection refused"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const initializeDbAndModels = (await import("./db.js")).default;
    await expect(initializeDbAndModels()).rejects.toThrow("connection refused");
    expect(consoleSpy).toHaveBeenCalled();
  });
});
