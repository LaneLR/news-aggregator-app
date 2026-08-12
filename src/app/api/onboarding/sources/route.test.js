import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Op } from "sequelize";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function makeRequest(qs) {
  return new NextRequest(`http://localhost/api/onboarding/sources?${qs}`);
}

describe("GET /api/onboarding/sources", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Article.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("categories=Business"));

    expect(res.status).toBe(401);
  });

  it("returns an empty list when no categories are given", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));

    const res = await GET(makeRequest("categories="));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sources).toEqual([]);
  });

  it("strips gated categories for non-subscribers before querying", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    db.Article.findAll.mockResolvedValue([]);

    const res = await GET(makeRequest("categories=Market,Business"));
    const body = await res.json();

    expect(res.status).toBe(200);
    const where = db.Article.findAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(where)[0];
    expect(where[andKey][0]).toEqual({ category: { [Op.overlap]: ["Business"] } });
  });

  it("excludes premium-tier sources for non-subscribers", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Free" }));
    db.Article.findAll.mockResolvedValue([]);

    await GET(makeRequest("categories=Business"));

    const where = db.Article.findAll.mock.calls[0][0].where;
    const andKey = Object.getOwnPropertySymbols(where)[0];
    expect(where[andKey][1].val).toBe(`("tier" = 'free' OR "sourceType" = 'podcast')`);
  });

  it("does not exclude premium-tier sources for subscribers", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Article.findAll.mockResolvedValue([]);

    await GET(makeRequest("categories=Business"));

    expect(db.Article.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { [Op.and]: [{ category: { [Op.overlap]: ["Business"] } }] },
      })
    );
  });

  it("ranks sources by article frequency and caps the list", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Article.findAll.mockResolvedValue([
      { sourceName: "Reuters" },
      { sourceName: "Reuters" },
      { sourceName: "AP" },
      { sourceName: null },
    ]);

    const res = await GET(makeRequest("categories=Business"));
    const body = await res.json();

    expect(body.sources).toEqual(["Reuters", "AP"]);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession({ tier: "Subscribed" }));
    db.Article.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest("categories=Business"));

    expect(res.status).toBe(500);
  });
});
