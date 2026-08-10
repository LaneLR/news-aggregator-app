import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createDbMock, createInstanceMock } from "@/test/dbMock";
import { makeSession } from "@/test/fixtures";

const db = createDbMock();
vi.mock("@/lib/db", () => ({ default: vi.fn(async () => db) }));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

const { PATCH } = await import("./route");

function makeRequest(body) {
  return new NextRequest("http://localhost/api/users/keyword-filters", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/users/keyword-filters", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ mutedKeywords: ["politics"] }));

    expect(res.status).toBe(401);
  });

  it("rejects a non-array payload", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await PATCH(makeRequest({ mutedKeywords: "politics" }));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ mutedKeywords: ["politics"] }));

    expect(res.status).toBe(404);
  });

  it("trims, dedupes, truncates, and caps keywords, then saves them", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);
    const many = Array.from({ length: 30 }, (_, i) => `kw${i}`);

    const res = await PATCH(makeRequest({ mutedKeywords: [" politics ", "politics", "", ...many] }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.mutedKeywords[0]).toBe("politics");
    expect(body.mutedKeywords.length).toBeLessThanOrEqual(25);
    expect(user.update).toHaveBeenCalledWith({ mutedKeywords: body.mutedKeywords });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makeRequest({ mutedKeywords: ["politics"] }));

    expect(res.status).toBe(500);
  });
});
