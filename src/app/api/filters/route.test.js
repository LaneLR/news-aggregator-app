import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const { GET } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/filters");
}

describe("GET /api/filters", () => {
  beforeEach(() => {
    db.Article.findAll.mockReset();
  });

  it("returns deduped, sorted sources and categories", async () => {
    db.Article.findAll
      .mockResolvedValueOnce([
        { sourceName: "Reuters" },
        { sourceName: "AP" },
        { sourceName: "Reuters" },
        { sourceName: null },
      ])
      .mockResolvedValueOnce([
        { category: ["Business", "Tech"] },
        { category: ["Tech"] },
        { category: null },
      ]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sources).toEqual(["AP", "Reuters"]);
    expect(body.categories).toEqual(["Business", "Tech"]);
  });

  it("returns 500 on an unexpected error", async () => {
    db.Article.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
  });
});
