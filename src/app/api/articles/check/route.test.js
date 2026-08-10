import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

function makeRequest(url) {
  return new NextRequest(url);
}

describe("GET /api/articles/check", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.SavedArticle.findOne.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/articles/check?url=x"));

    expect(res.status).toBe(401);
  });

  it("rejects a missing url", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await GET(makeRequest("http://localhost/api/articles/check"));

    expect(res.status).toBe(400);
  });

  it("reports saved:true with the archiveId when found", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.SavedArticle.findOne.mockResolvedValue(createInstanceMock({ archiveId: 7 }));

    const res = await GET(makeRequest("http://localhost/api/articles/check?url=https://x.com"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ saved: true, archiveId: 7 });
  });

  it("reports saved:false when not found", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.SavedArticle.findOne.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/articles/check?url=https://x.com"));
    const body = await res.json();

    expect(body).toEqual({ saved: false });
  });
});
