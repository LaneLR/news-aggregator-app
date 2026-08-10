import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { POST } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/articles/like", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/articles/like", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.ArticleLike.findOne.mockReset();
    db.ArticleLike.create.mockReset();
    db.Article.update.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ articleUrl: "https://x.com" }));

    expect(res.status).toBe(401);
  });

  it("rejects a missing articleUrl", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("likes an article that isn't liked yet", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.ArticleLike.findOne.mockResolvedValue(null);

    const res = await POST(makeRequest({ articleUrl: "https://x.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.liked).toBe(true);
    expect(db.ArticleLike.create).toHaveBeenCalled();
  });

  it("unlikes an already-liked article", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const existing = { destroy: vi.fn(async () => {}) };
    db.ArticleLike.findOne.mockResolvedValue(existing);

    const res = await POST(makeRequest({ articleUrl: "https://x.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.liked).toBe(false);
    expect(existing.destroy).toHaveBeenCalled();
  });

  it("treats a lost unique-constraint race as a successful like", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const err = new Error("dup");
    err.name = "SequelizeUniqueConstraintError";
    db.ArticleLike.findOne.mockRejectedValue(err);

    const res = await POST(makeRequest({ articleUrl: "https://x.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.liked).toBe(true);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.ArticleLike.findOne.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ articleUrl: "https://x.com" }));

    expect(res.status).toBe(500);
  });
});
