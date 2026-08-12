import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
db.sequelize.query = vi.fn();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function makeRequest(qs) {
  return new NextRequest(`http://localhost/api/search/suggestions?${qs}`);
}

describe("GET /api/search/suggestions", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.sequelize.query.mockReset();
  });

  it("returns an empty list for a too-short query without querying the db", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("query=a"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.suggestions).toEqual([]);
    expect(db.sequelize.query).not.toHaveBeenCalled();
  });

  it("returns suggestions for a valid query", async () => {
    mockAuth.mockResolvedValue(null);
    db.sequelize.query.mockResolvedValue([{ id: "a1", title: "Fed raises rates" }]);

    const res = await GET(makeRequest("query=fed"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.suggestions).toHaveLength(1);
  });

  it("restricts non-subscribers to free-tier/podcast results outside Market/Journal", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    db.sequelize.query.mockResolvedValue([]);

    await GET(makeRequest("query=market"));

    const sql = db.sequelize.query.mock.calls[0][0];
    expect(sql).toContain(`"tier" = 'free' OR "sourceType" = 'podcast'`);
    expect(sql).toContain(`NOT ("category" &&`);
  });

  it("returns an empty list (with 500) on an unexpected error", async () => {
    mockAuth.mockResolvedValue(null);
    db.sequelize.query.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest("query=fed"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.suggestions).toEqual([]);
  });
});
