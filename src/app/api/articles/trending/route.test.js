import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession, makeArticle } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function makeRequest(url = "http://localhost/api/articles/trending") {
  return new NextRequest(url);
}

describe("GET /api/articles/trending", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Article.findAll.mockReset();
  });

  it("returns clickCount-sorted articles by default for anonymous visitors", async () => {
    mockAuth.mockResolvedValue(null);
    db.Article.findAll.mockResolvedValue([makeArticle()]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.articles).toHaveLength(1);
    const call = db.Article.findAll.mock.calls[0][0];
    expect(call.order).toEqual([["clickCount", "DESC"]]);
  });

  it("sorts by likeCount when sort=liked", async () => {
    mockAuth.mockResolvedValue(null);
    db.Article.findAll.mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/articles/trending?sort=liked"));

    const call = db.Article.findAll.mock.calls[0][0];
    expect(call.order).toEqual([["likeCount", "DESC"]]);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(null);
    db.Article.findAll.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest());

    expect(res.status).toBe(500);
  });
});
