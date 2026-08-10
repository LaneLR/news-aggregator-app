import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { DELETE } = await import("./route");

function makeRequest() {
  return new NextRequest("http://localhost/api/archives/1", { method: "DELETE" });
}

describe("DELETE /api/archives/[archiveId]", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.destroy.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(makeRequest(), { params: Promise.resolve({ archiveId: "1" }) });

    expect(res.status).toBe(401);
  });

  it("returns 404 when nothing was deleted", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.destroy.mockResolvedValue(0);

    const res = await DELETE(makeRequest(), { params: Promise.resolve({ archiveId: "999" }) });

    expect(res.status).toBe(404);
  });

  it("deletes the archive and awaits the params promise correctly", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    db.Archive.destroy.mockResolvedValue(1);

    const res = await DELETE(makeRequest(), { params: Promise.resolve({ archiveId: "42" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Archive deleted");
    // Regression check for the params-not-awaited bug: id must actually
    // resolve to 42, not NaN, once params (a Promise) is awaited.
    expect(db.Archive.destroy).toHaveBeenCalledWith({
      where: { id: 42, userId: expect.any(String) },
    });
  });
});
