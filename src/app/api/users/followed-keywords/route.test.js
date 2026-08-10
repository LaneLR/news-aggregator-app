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
  return new NextRequest("http://localhost/api/users/followed-keywords", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/users/followed-keywords", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    db.User.findByPk.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ followedKeywords: ["ai"] }));

    expect(res.status).toBe(401);
  });

  it("rejects a non-array payload", async () => {
    mockAuth.mockResolvedValue(makeSession());

    const res = await PATCH(makeRequest({ followedKeywords: "ai" }));

    expect(res.status).toBe(400);
  });

  it("returns 404 when the user no longer exists", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ followedKeywords: ["ai"] }));

    expect(res.status).toBe(404);
  });

  it("trims, dedupes, truncates, and caps keywords", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const user = createInstanceMock();
    db.User.findByPk.mockResolvedValue(user);
    const longWord = "x".repeat(50);
    const many = Array.from({ length: 30 }, (_, i) => `kw${i}`);

    const res = await PATCH(
      makeRequest({ followedKeywords: [" ai ", "ai", "", longWord, ...many] })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.followedKeywords[0]).toBe("ai");
    expect(body.followedKeywords).not.toContain("");
    expect(body.followedKeywords.find((k) => k.length > 40)).toBeUndefined();
    expect(body.followedKeywords.length).toBeLessThanOrEqual(25);
    expect(user.update).toHaveBeenCalledWith({ followedKeywords: body.followedKeywords });
  });

  it("returns 500 on an unexpected error", async () => {
    mockAuth.mockResolvedValue(makeSession());
    db.User.findByPk.mockRejectedValue(new Error("db down"));

    const res = await PATCH(makeRequest({ followedKeywords: ["ai"] }));

    expect(res.status).toBe(500);
  });
});
