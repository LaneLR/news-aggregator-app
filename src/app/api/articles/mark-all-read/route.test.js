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
  return new NextRequest("http://localhost/api/articles/mark-all-read", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/articles/mark-all-read", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.ReadArticle.bulkCreate.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ urls: ["https://x.com"] }));

    expect(res.status).toBe(401);
  });

  it("rejects a non-array or empty urls payload", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makeRequest({ urls: [] }));

    expect(res.status).toBe(400);
  });

  it("bulk-creates ReadArticle rows for the given urls", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));

    const res = await POST(makeRequest({ urls: ["https://a.com", "https://b.com"] }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.ReadArticle.bulkCreate).toHaveBeenCalledWith(
      [
        { userId: expect.any(String), articleUrl: "https://a.com" },
        { userId: expect.any(String), articleUrl: "https://b.com" },
      ],
      { ignoreDuplicates: true }
    );
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.ReadArticle.bulkCreate.mockRejectedValue(new Error("db down"));

    const res = await POST(makeRequest({ urls: ["https://a.com"] }));

    expect(res.status).toBe(500);
  });
});
