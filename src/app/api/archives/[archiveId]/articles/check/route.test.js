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

describe("GET /api/archives/[archiveId]/articles/check", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOne.mockReset();
    db.SavedArticle.findOne.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/archives/1/articles/check?url=x"), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(401);
  });

  it("rejects a missing url param", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await GET(makeRequest("http://localhost/api/archives/1/articles/check"), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 when the archive doesn't belong to the user", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/archives/1/articles/check?url=x"), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(404);
  });

  it("resolves the params promise and reports saved:true when found", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(createInstanceMock({ id: 1 }));
    db.SavedArticle.findOne.mockResolvedValue(createInstanceMock({ id: 5 }));

    const res = await GET(
      makeRequest("http://localhost/api/archives/1/articles/check?url=https://x.com"),
      { params: Promise.resolve({ archiveId: "1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.saved).toBe(true);
    expect(db.Archive.findOne).toHaveBeenCalledWith({
      where: { id: 1, userId: expect.any(String) },
    });
  });

  it("reports saved:false when not found", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(createInstanceMock({ id: 1 }));
    db.SavedArticle.findOne.mockResolvedValue(null);

    const res = await GET(makeRequest("http://localhost/api/archives/1/articles/check?url=x"), {
      params: Promise.resolve({ archiveId: "1" }),
    });
    const body = await res.json();

    expect(body.saved).toBe(false);
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockRejectedValue(new Error("db down"));

    const res = await GET(makeRequest("http://localhost/api/archives/1/articles/check?url=x"), {
      params: Promise.resolve({ archiveId: "1" }),
    });

    expect(res.status).toBe(500);
  });
});
