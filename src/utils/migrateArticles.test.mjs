import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";

// migrateArticles.mjs runs its migrate() function immediately at import time
// (`migrate().catch(...)` at the bottom, not gated behind a function export
// or a "run as main" check) rather than exporting anything testable
// directly. To test it at all we have to let that side effect happen against
// a fully mocked @/lib/db and then poll (via waitFor) for the async chain to
// finish, since the dynamic import() promise resolves as soon as the
// module's synchronous top-level code finishes — not once migrate()'s
// internal awaits have settled. vi.resetModules() + a fresh dynamic import
// per test re-triggers that top-level execution for each case.
let existingTables;
const mockQuery = vi.fn();
const mockClose = vi.fn();

vi.mock("@/lib/db", () => ({
  default: vi.fn(async () => ({ sequelize: { query: mockQuery, close: mockClose } })),
}));

describe("migrateArticles.mjs", () => {
  beforeEach(() => {
    vi.resetModules();
    existingTables = new Set();
    mockClose.mockReset().mockResolvedValue(undefined);
    mockQuery.mockReset().mockImplementation((sql) => {
      const existsMatch = sql.match(/to_regclass\('"(\w+)"'\)/);
      if (existsMatch) {
        return Promise.resolve([[{ exists: existingTables.has(existsMatch[1]) }]]);
      }
      return Promise.resolve([undefined, { rowCount: 3 }]);
    });
  });

  it("skips migration and logs 'nothing to migrate' when no legacy tables exist", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("./migrateArticles.mjs");
    await waitFor(() => expect(mockClose).toHaveBeenCalled());

    const insertCalls = mockQuery.mock.calls.filter(([sql]) => sql.includes("INSERT INTO"));
    expect(insertCalls).toHaveLength(0);
    expect(logSpy.mock.calls.flat().join(" ")).toMatch(/Nothing to migrate/);
  });

  it("migrates rows from every legacy table that exists and closes the connection", async () => {
    existingTables = new Set(["NewsArticles", "JournalArticles", "MarketArticles", "Podcasts"]);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("./migrateArticles.mjs");
    await waitFor(() => expect(mockClose).toHaveBeenCalled());

    const insertCalls = mockQuery.mock.calls.filter(([sql]) => sql.includes("INSERT INTO"));
    expect(insertCalls).toHaveLength(4);
    expect(logSpy.mock.calls.flat().join(" ")).toMatch(/Migration complete/);
  });

  it("migrates only the subset of legacy tables that actually exist", async () => {
    existingTables = new Set(["Podcasts"]);
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("./migrateArticles.mjs");
    await waitFor(() => expect(mockClose).toHaveBeenCalled());

    const insertCalls = mockQuery.mock.calls.filter(([sql]) => sql.includes("INSERT INTO"));
    expect(insertCalls).toHaveLength(1);
    // Podcasts has no likeCount column, so the migration selects a literal 0.
    expect(insertCalls[0][0]).toContain('SELECT title, url, "urlToImage", "sourceName", "publishedAt", country, category, 0');
  });

  it("logs and exits the process when a query fails", async () => {
    existingTables = new Set(["NewsArticles"]);
    mockQuery.mockImplementation((sql) => {
      if (sql.match(/to_regclass/)) return Promise.resolve([[{ exists: true }]]);
      return Promise.reject(new Error("connection refused"));
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});

    await import("./migrateArticles.mjs");
    await waitFor(() => expect(exitSpy).toHaveBeenCalledWith(1));

    expect(errorSpy).toHaveBeenCalled();
  });
});
