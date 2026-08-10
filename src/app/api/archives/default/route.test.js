import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { GET } = await import("./route");

describe("GET /api/archives/default", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.Archive.findOne.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns 404 when there's no default archive yet", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(404);
  });

  it("returns the default archive's id", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockResolvedValue(createInstanceMock({ id: 3 }));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.archiveId).toBe(3);
    expect(db.Archive.findOne).toHaveBeenCalledWith({
      where: { userId: expect.any(String), name: "Saved for later" },
    });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.Archive.findOne.mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(500);
  });
});
