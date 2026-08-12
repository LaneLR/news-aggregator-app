import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";

const db = createDbMock();
db.sequelize.query = vi.fn();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const { GET } = await import("./route");

function makeRequest(url = "http://localhost/api/fetched") {
  return new NextRequest(url);
}

describe("GET /api/fetched", () => {
  beforeEach(() => {
    db.sequelize.query.mockReset();
  });

  it("returns matching free-tier articles for a bare query", async () => {
    db.sequelize.query.mockResolvedValue([{ id: 1, title: "Match", sourceType: "news" }]);

    const res = await GET(makeRequest("http://localhost/api/fetched?q=nvidia"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toHaveLength(1);
    const sql = db.sequelize.query.mock.calls[0][0];
    expect(sql).toContain(`"tier" = 'free' OR "sourceType" = 'podcast'`);
    expect(sql).toContain(`NOT ("category" &&`);
  });

  it("applies a category filter when provided", async () => {
    db.sequelize.query.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/fetched?category=Business"));

    const [, opts] = db.sequelize.query.mock.calls[0];
    expect(opts.replacements.category).toBe("%Business%");
  });

  it("returns 500 on an unexpected error", async () => {
    db.sequelize.query.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
  });
});
