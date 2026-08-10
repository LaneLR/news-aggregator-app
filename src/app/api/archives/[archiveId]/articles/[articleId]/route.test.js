import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { DELETE } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/archives/1/articles/2", { method: "DELETE" });
}

describe("DELETE /api/archives/[archiveId]/articles/[articleId]", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOne.mockReset();
    db.SavedArticle.destroy.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(makeRequest(), {
      params: Promise.resolve({ archiveId: "1", articleId: "2" }),
    });

    expect(res.status).toBe(401);
  });

  it("rejects invalid (NaN) ids", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await DELETE(makeRequest(), {
      params: Promise.resolve({ archiveId: "abc", articleId: "2" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 404 when the archive doesn't belong to the user", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(null);

    const res = await DELETE(makeRequest(), {
      params: Promise.resolve({ archiveId: "1", articleId: "2" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 when the article wasn't found in that archive", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(createInstanceMock({ id: 1 }));
    db.SavedArticle.destroy.mockResolvedValue(0);

    const res = await DELETE(makeRequest(), {
      params: Promise.resolve({ archiveId: "1", articleId: "2" }),
    });

    expect(res.status).toBe(404);
  });

  it("deletes the article, correctly awaiting the params promise for both ids", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(createInstanceMock({ id: 1 }));
    db.SavedArticle.destroy.mockResolvedValue(1);

    const res = await DELETE(makeRequest(), {
      params: Promise.resolve({ archiveId: "1", articleId: "2" }),
    });

    expect(res.status).toBe(204);
    expect(db.SavedArticle.destroy).toHaveBeenCalledWith({
      where: { id: 2, archiveId: 1 },
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockRejectedValue(new Error("db down"));

    const res = await DELETE(makeRequest(), {
      params: Promise.resolve({ archiveId: "1", articleId: "2" }),
    });

    expect(res.status).toBe(500);
  });
});
