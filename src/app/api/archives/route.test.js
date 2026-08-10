import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock } from "@/test/dbMock";
import { makeSession, makeArchive } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET, POST } = await import("./route");

function makePostRequest(body) {
  return new NextRequest("http://localhost/api/archives", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/archives", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findAll.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns the user's archives", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findAll.mockResolvedValue([makeArchive()]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.archives).toHaveLength(1);
  });
});

describe("POST /api/archives", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOrCreate.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makePostRequest({ name: "Reading list" }));

    expect(res.status).toBe(401);
  });

  it("rejects a blank name", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await POST(makePostRequest({ name: "   " }));

    expect(res.status).toBe(400);
  });

  it("finds or creates the archive by trimmed name", async () => {
    mockAuth.mockResolvedValue(makeSession({ id: "user-1" }));
    const archive = makeArchive({ name: "Reading list" });
    db.Archive.findOrCreate.mockResolvedValue([archive, true]);

    const res = await POST(makePostRequest({ name: "  Reading list  " }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.archive.name).toBe("Reading list");
    expect(db.Archive.findOrCreate).toHaveBeenCalledWith({
      where: { userId: expect.any(String), name: "Reading list" },
    });
  });
});
